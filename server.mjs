import http from 'node:http';
import { mkdir,readFile,writeFile,rename,readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { resolve,join } from 'node:path';
import app from './app.mjs';
const directory=resolve(process.env.DATA_DIR||'./data');
if(!process.env.ADMIN_PASSWORD||process.env.ADMIN_PASSWORD.length<16)throw Error('Set ADMIN_PASSWORD to a unique password of at least 16 characters.');
await mkdir(directory,{recursive:true});
const pathFor=key=>join(directory,Buffer.from(key).toString('base64url'));
const bucket={
 async get(key){const p=pathFor(key);let meta;try{meta=JSON.parse(await readFile(p+'.json','utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}return {httpMetadata:meta.httpMetadata||{},body:Readable.toWeb(createReadStream(p+'.bin')),json:async()=>JSON.parse(await readFile(p+'.bin','utf8'))};},
 async put(key,value,options={}){const p=pathFor(key),suffix='.'+crypto.randomUUID()+'.tmp';const bytes=typeof value==='string'?Buffer.from(value):Buffer.from(await new Response(value).arrayBuffer());await writeFile(p+suffix,bytes);await rename(p+suffix,p+'.bin');await writeFile(p+suffix,JSON.stringify({key,httpMetadata:options.httpMetadata||{}}));await rename(p+suffix,p+'.json');},
 async list({prefix='',cursor}={}){const keys=[];for(const name of await readdir(directory)){if(!name.endsWith('.json'))continue;const key=Buffer.from(name.slice(0,-5),'base64url').toString();if(key.startsWith(prefix))keys.push(key);}keys.sort();const start=cursor?Number(cursor):0;const objects=keys.slice(start,start+1000).map(key=>({key}));return {objects,truncated:start+1000<keys.length,cursor:String(start+1000)};}
};
const attempts=new Map();
http.createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://localhost');
if(url.pathname==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('ok');}
if(url.pathname==='/api/admin'||url.pathname==='/api/gifts'||url.pathname==='/api/guestbook'){
const key=req.socket.remoteAddress,now=Date.now(),entry=attempts.get(key)||{count:0,until:now+60000};if(entry.until<now){entry.count=0;entry.until=now+60000;}entry.count++;attempts.set(key,entry);if(entry.count>30){res.writeHead(429,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Please wait a minute before trying again.'}));}
}
let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>105*1024*1024){res.writeHead(413);return res.end('Upload is too large');}chunks.push(chunk);}
const request=new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,body:chunks.length?Buffer.concat(chunks):undefined});
const response=await app.fetch(request,{BUCKET:bucket,ADMIN_PASSWORD:process.env.ADMIN_PASSWORD});
res.writeHead(response.status,{...Object.fromEntries(response.headers),'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY'});
if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
}catch(e){console.error('Request failed:',e.message);if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Unable to complete the request. Please try again.'}));}
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Wedding site is running'));
