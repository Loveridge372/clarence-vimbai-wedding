import nodemailer from "nodemailer";
const validEmail=value=>typeof value==='string'&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
export function messagingStatus(env=process.env){
 const required=['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASSWORD','EMAIL_FROM','PUBLIC_SITE_URL'];const missing=required.filter(k=>!env[k]);
 return {enabled:env.EMAIL_ENABLED==='true'&&missing.length===0,missing,switchedOn:env.EMAIL_ENABLED==='true',provider:'smtp'};
}
export async function notifyDecision(guest,{env=process.env,createTransport=nodemailer.createTransport}={}){
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
 const port=Number(env.SMTP_PORT);
 if(![465,587].includes(port)||!validEmail(env.SMTP_USER)||!validEmail(env.EMAIL_FROM))return {status:'not_configured',detail:'Check SMTP port, username and sender address.'};
 const transport=createTransport({host:env.SMTP_HOST,port,secure:port===465,requireTLS:true,auth:{user:env.SMTP_USER,pass:env.SMTP_PASSWORD},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:30000,logger:false,debug:false,disableFileAccess:true,disableUrlAccess:true});
 try{
 const result=await transport.sendMail({from:{name:'Vimbai & Clarence',address:env.EMAIL_FROM},to:guest.email,subject:guest.status==='approved'?'Your RSVP is approved — Vimbai & Clarence':'Your RSVP update — Vimbai & Clarence',text,...(env.EMAIL_REPLY_TO?{replyTo:env.EMAIL_REPLY_TO}:{}),messageId:'<rsvp-'+guest.emailNotification.attemptId+'@'+env.EMAIL_FROM.split('@')[1]+'>'});
 if(!result.accepted?.length)return {status:'failed',detail:'Mail server did not accept the recipient.'};
 return {status:'submitted',sid:result.messageId,detail:'Accepted by the mail server; inbox delivery is not confirmed.'};
 }catch(error){
 if(['EAUTH','EENVELOPE','EDNS','ECONNECTION','ETLS'].includes(error.code)||Number(error.responseCode)>=400)return {status:'failed',detail:'Mail server rejected the connection or message. Check SMTP settings and credentials.'};
 return {status:'unknown',detail:'Email sending result uncertain. Check mail delivery logs before retrying to avoid duplicate emails.'};
 }finally{transport.close?.()}
}
