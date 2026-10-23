const REPOSITORY='alex5674321/Seguiment_EELs';
const FILE=`https://api.github.com/repos/${REPOSITORY}/contents/data/feedback.json`;
export async function handle(request,env,githubFetch=fetch){
 const origin=env.ALLOWED_ORIGIN||'https://alex5674321.github.io';
 const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==origin)return reply({error:'Origin not allowed'},403);
 if(new URL(request.url).pathname!=='/feedback')return reply({error:'Not found'},404);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed'},405);
 if(!env.GITHUB_TOKEN||!env.FEEDBACK_CODE)return reply({error:'Feedback service is not configured'},503);
 const ghHeaders={Accept:'application/vnd.github+json',Authorization:`Bearer ${env.GITHUB_TOKEN}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'EEL-Feedback'};
 async function read(){
  const response=await githubFetch(FILE+'?ref=main',{headers:ghHeaders,cache:'no-store'});
  if(response.status===404)return {rows:[],sha:undefined};
  if(!response.ok)throw Error('read');
  const file=await response.json();if(file.size>500000)throw Error('size');
  const bytes=Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0));
  const rows=JSON.parse(new TextDecoder().decode(bytes));if(!Array.isArray(rows))throw Error('format');
  return {rows,sha:file.sha};
 }
 try{
  if(request.method==='GET'){const {rows}=await read();return reply(rows.slice(-50).reverse());}
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
  let payload;
  const reader=request.body?.getReader();if(!reader)return reply({error:'Body required'},400);
  let size=0;const chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>12000){await reader.cancel();return reply({error:'Message too large'},413);}chunks.push(value);}
  try{const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}payload=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({error:'Invalid JSON'},400);}
  if(!payload||typeof payload!=='object')return reply({error:'Invalid message'},400);
  if(payload.visitor_code!==env.FEEDBACK_CODE)return reply({error:'Incorrect access code'},403);
  const name=typeof payload.author==='string'?payload.author.trim():'';
  const message=typeof payload.feedback==='string'?payload.feedback.trim():'';
  const id=payload.id;
  if(!message||message.length>2000||name.length>80||typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))return reply({error:'Invalid message'},400);
  const entry={id,name,message,created_at:new Date().toISOString()};
  for(let attempt=0;attempt<4;attempt++){
   const {rows,sha}=await read();const existing=rows.find(row=>row.id===id);if(existing)return existing.name===name&&existing.message===message?reply([existing]):reply({error:'This request was already saved. Please retry your new message.'},409);
   const bytes=new TextEncoder().encode(JSON.stringify([...rows,entry],null,2)+'\n');
   if(bytes.length>500000)return reply({error:'Feedback storage needs maintenance'},503);
   const content=btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
   const response=await githubFetch(FILE,{method:'PUT',headers:{...ghHeaders,'Content-Type':'application/json'},body:JSON.stringify({message:'Add visitor feedback',content,...(sha?{sha}:{}),branch:'main'})});
   if(response.ok)return reply([entry],201);
   if(![409,422].includes(response.status))throw Error('write');
  }
  return reply({error:'Another message was saved first. Please try again.'},409);
 }catch{return reply({error:'Feedback is temporarily unavailable. Please try again.'},502);}
}
export default {fetch(request,env){return handle(request,env);}};
