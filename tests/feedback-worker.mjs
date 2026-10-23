import {handle} from '../feedback-worker/worker.mjs';
import assert from 'node:assert/strict';
const env={GITHUB_TOKEN:'server-only-test-token',FEEDBACK_CODE:'AlexEELs',ALLOWED_ORIGIN:'https://alex5674321.github.io'};
let rows=[],sha='v1',calls=0,conflict=false,fail=false;
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64');
async function github(url,options){calls++;assert.match(url,/repos\/alex5674321\/Seguiment_EELs\/contents\/data\/feedback.json/);assert.equal(options.headers.Authorization,'Bearer '+env.GITHUB_TOKEN);if(fail)return new Response('{}',{status:500});if(options.method==='PUT'){const body=JSON.parse(options.body);assert.equal(body.sha,sha);assert.equal(body.branch,'main');if(conflict){conflict=false;rows.push({id:'peer',name:'Other visitor',message:'Concurrent feedback'});sha='v2';return new Response('{}',{status:409});}rows=JSON.parse(Buffer.from(body.content,'base64'));sha='v3';return Response.json({content:{sha}});}return Response.json({sha,content:encode(rows)});}
const id='12345678-1234-1234-1234-123456789abc';
const post=(code='AlexEELs',extra={})=>new Request('https://feedback.example/feedback',{method:'POST',headers:{'Content-Type':'application/json',Origin:env.ALLOWED_ORIGIN},body:JSON.stringify({id,visitor_code:code,author:' Visitor ',feedback:' Hello · món ',...extra})});
assert.equal((await handle(post('wrong'),env,github)).status,403);assert.equal(calls,0);
assert.equal((await handle(post('AlexEELs',{feedback:' '}),env,github)).status,400);
conflict=true;const saved=await handle(post(),env,github);assert.equal(saved.status,201);assert.equal(rows.length,2);assert.equal(rows[1].message,'Hello · món');assert.equal(rows[0].id,'peer');assert.equal(JSON.stringify(rows).includes('AlexEELs'),false);
assert.equal((await handle(post(),env,github)).status,200);assert.equal(rows.length,2);
const listed=await handle(new Request('https://feedback.example/feedback'),env,github);assert.equal((await listed.json()).at(-1).id,id);
assert.equal((await handle(new Request('https://feedback.example/feedback',{headers:{Origin:'https://other.example'}}),env,github)).status,403);
assert.equal((await handle(new Request('https://feedback.example/feedback',{method:'OPTIONS',headers:{Origin:env.ALLOWED_ORIGIN}}),env,github)).status,204);
assert.equal((await handle(post(),{},github)).status,503);
fail=true;const error=await handle(post(),env,github);assert.equal(error.status,502);assert.equal((await error.text()).includes(env.GITHUB_TOKEN),false);
let created=false;
const initial=await handle(post(),env,async(url,options)=>{if(options.method!=='PUT')return new Response('{}',{status:404});const body=JSON.parse(options.body);assert.equal(body.sha,undefined);assert.equal(JSON.parse(Buffer.from(body.content,'base64'))[0].message,'Hello · món');created=true;return Response.json({content:{sha:'new'}});});assert.equal(initial.status,201);assert.equal(created,true);
console.log('PASS: shared-code validation, server-only credential, GitHub persistence, UTF-8, conflict retry preserving concurrent feedback, duplicate prevention, CORS, missing configuration and upstream errors. GitHub mocked.');

for(const [status,code] of [[401,'GITHUB_TOKEN_INVALID'],[403,'GITHUB_PERMISSION_DENIED']]){const response=await handle(post(),env,async()=>new Response('{}',{status}));const body=await response.json();assert.equal(body.code,code);assert.equal(body.operation,'read');assert.equal(body.upstream_status,status);assert.equal(JSON.stringify(body).includes(env.GITHUB_TOKEN),false);}
console.log('PASS: expired-token and permission-denied diagnostics contain no credentials.');
