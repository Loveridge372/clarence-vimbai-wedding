const validEmail=value=>typeof value==='string'&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
export function messagingStatus(env=process.env){
 const required=['RESEND_API_KEY','EMAIL_FROM','PUBLIC_SITE_URL'];const missing=required.filter(k=>!env[k]);
 return {enabled:env.EMAIL_ENABLED==='true'&&missing.length===0,missing,switchedOn:env.EMAIL_ENABLED==='true',provider:'resend'};
}
export async function notifyDecision(guest,{env=process.env,fetcher=fetch}={}){
 if(!validEmail(guest.email))return {status:'no_email',detail:'This RSVP has no valid email address.'};
 if(guest.emailConsent!==true)return {status:'no_consent',detail:'The guest has not opted in to email RSVP updates.'};
 if(!['approved','declined'].includes(guest.status))return {status:'failed',detail:'Invalid RSVP decision.'};
 if(!messagingStatus(env).enabled)return {status:'not_configured',detail:'Email sending is not connected. The RSVP decision is saved.'};
 let origin;try{const u=new URL(env.PUBLIC_SITE_URL);if(u.protocol!=='https:')throw Error();origin=u.origin}catch{return {status:'not_configured',detail:'PUBLIC_SITE_URL must be the HTTPS wedding website address.'}}
 if(/[\r\n]/.test(env.EMAIL_FROM)||!env.EMAIL_FROM.includes('@'))return {status:'not_configured',detail:'Check the verified sender address.'};
 if(env.EMAIL_REPLY_TO&&!validEmail(env.EMAIL_REPLY_TO))return {status:'not_configured',detail:'Check the reply-to address.'};
 const name=String(guest.name||'Guest').trim().replace(/\s+/g,' '),link=origin+'/?guest='+encodeURIComponent(guest.id)+'#status';
 const date=new Date(guest.weddingDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
 const text=guest.status==='approved'?`Hello ${name},\n\nYour RSVP for Vimbai and Clarence’s wedding on ${date} at ${guest.weddingTime||'13:30'} (Harare time) has been approved.\n\nWe can’t wait to celebrate with you! Open your personal link to enter the guest lounge and view the programme and directions:\n${link}\n\nPlease keep this link private.\n\nWith love,\nVimbai & Clarence`:`Hello ${name},\n\nThank you for responding to Vimbai and Clarence’s wedding invitation. We are unable to confirm your attendance. We appreciate your understanding and send our warm wishes.\n\nVimbai & Clarence`;
 const body={from:env.EMAIL_FROM,to:[guest.email],subject:guest.status==='approved'?'Your RSVP is approved — Vimbai & Clarence':'Your RSVP update — Vimbai & Clarence',text,...(env.EMAIL_REPLY_TO?{reply_to:env.EMAIL_REPLY_TO}:{})};
 try{const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'rsvp-'+guest.id+'-'+guest.emailNotification.attemptId},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});let result;try{result=await response.json()}catch{return {status:'unknown',detail:'Unreadable email provider response. Check provider logs before retrying.'}}
 if(!response.ok)return {status:'failed',code:response.status,detail:'Email provider rejected the request. Check provider logs before retrying.'};if(!result.id)return {status:'unknown',detail:'No email ID returned. Check provider logs before retrying.'};return {status:'submitted',sid:result.id,detail:'Submitted to email provider; inbox delivery is not confirmed.'};
 }catch{return {status:'unknown',detail:'Email sending result uncertain. Check provider logs before retrying to avoid duplicate emails.'}}
}
