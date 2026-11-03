export function messagingStatus(env=process.env){
 const required=['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_WHATSAPP_FROM','TWILIO_APPROVAL_CONTENT_SID','TWILIO_DECLINE_CONTENT_SID','PUBLIC_SITE_URL'];
 const missing=required.filter(k=>!env[k]);
 return {enabled:env.TWILIO_WHATSAPP_ENABLED==='true'&&missing.length===0,missing,switchedOn:env.TWILIO_WHATSAPP_ENABLED==='true'};
}
export async function notifyDecision(guest,{env=process.env,fetcher=fetch}={}){
 if(!guest.whatsapp)return {status:'no_number',detail:'This RSVP has no WhatsApp number.'};
 if(!guest.whatsappConsent)return {status:'no_consent',detail:'The guest has not opted in to WhatsApp updates.'};
 const config=messagingStatus(env);if(!config.enabled)return {status:'not_configured',detail:'WhatsApp sending is not enabled. The RSVP decision is saved.'};
 const sid=env.TWILIO_ACCOUNT_SID,contentSid=guest.status==='approved'?env.TWILIO_APPROVAL_CONTENT_SID:env.TWILIO_DECLINE_CONTENT_SID;
 if(!/^AC[0-9a-f]{32}$/i.test(sid)||!/^HX[0-9a-f]{32}$/i.test(contentSid)||!/^whatsapp:\+[1-9]\d{7,14}$/.test(env.TWILIO_WHATSAPP_FROM))return {status:'not_configured',detail:'Check Twilio account, sender and approved template IDs.'};
 let origin;try{const u=new URL(env.PUBLIC_SITE_URL);if(u.protocol!=='https:')throw Error();origin=u.origin}catch{return {status:'not_configured',detail:'PUBLIC_SITE_URL must be your HTTPS website address.'}}
 const name=guest.name.trim().replace(/\s+/g,' '),couple='Vimbai and Clarence';
 const variables=guest.status==='approved'?{'1':name,'2':new Date(guest.weddingDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}),'3':guest.weddingTime||'13:30','4':String(guest.guests),'5':origin+'/?guest='+encodeURIComponent(guest.id)+'#status'}:{'1':name,'2':couple};
 const body=new URLSearchParams({From:env.TWILIO_WHATSAPP_FROM,To:'whatsapp:'+guest.whatsapp,ContentSid:contentSid,ContentVariables:JSON.stringify(variables)});
 try{
  const response=await fetcher('https://api.twilio.com/2010-04-01/Accounts/'+sid+'/Messages.json',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(sid+':'+env.TWILIO_AUTH_TOKEN).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(15000)});
  let result;try{result=await response.json()}catch{return {status:response.ok?'unknown':'failed',detail:'Twilio returned an unreadable response. Check Twilio logs before retrying.'}}
  if(!response.ok)return {status:'failed',code:result.code||response.status,detail:'Twilio rejected the request. Check the Twilio error code before retrying.'};
  if(!result.sid)return {status:'unknown',detail:'No message ID was returned. Check Twilio logs before retrying.'};
  return {status:'submitted',sid:result.sid,providerStatus:result.status||'accepted',detail:'Submitted to Twilio; delivery has not been confirmed.'};
 }catch{return {status:'unknown',detail:'The send result is uncertain. Check Twilio logs before retrying to avoid duplicate messages.'}}
}
