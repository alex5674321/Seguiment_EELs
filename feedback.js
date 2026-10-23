'use strict';
let feedbackBusy=false;
const feedbackDraft={name:'',message:''};
let feedbackRequestId=crypto.randomUUID();
function feedbackConnection(){
  try{const url=new URL(window.FEEDBACK_CONFIG?.endpoint);if(url.protocol!=='https:'||url.username||url.password)return null;return {endpoint:url.href,headers:{'Content-Type':'application/json'}};}catch{return null;}
}
function feedbackServiceError(code){return ({403:'Incorrect access code. Feedback was not saved.',404:'Feedback endpoint not found. The site owner needs to check the Worker URL.',409:'Feedback was not saved. Please press Send again.',503:'Feedback service needs setup. The site owner must configure GITHUB_TOKEN and FEEDBACK_CODE in Cloudflare.',502:'Feedback cannot connect to GitHub. The site owner needs to check the Worker token and repository permissions.'})[code]||`Feedback was not saved (HTTP ${code}). Please try again later.`;}
function feedbackRequestError(error){if(error.name==='TimeoutError'||error.name==='AbortError')return 'Feedback took too long to respond. Check your connection and try again; your message is kept.';if(error instanceof TypeError)return 'Cannot reach the feedback service. Check your connection. The site owner should also check the Worker URL and allowed origin.';return error.message;}
function feedbackPanel(){
  const ready=!!feedbackConnection();
  return `<section class="panel feedback-section"><div class="section-head"><h2>Feedback</h2><span class="badge">Open to everyone</span></div><p class="meta">Leave a suggestion, question or comment. Enter the shared access code to post. No GitHub account required. Messages are public; please avoid personal information.</p><form id="feedbackForm"><label for="feedbackCode">Access code</label><input id="feedbackCode" name="code" type="password" required autocomplete="off"><label for="feedbackName">Name (optional)</label><input id="feedbackName" name="name" maxlength="80" autocomplete="nickname" value="${esc(feedbackDraft.name)}"><label for="feedbackMessage">Your feedback</label><textarea id="feedbackMessage" name="message" maxlength="2000" required placeholder="What would you like to share?">${esc(feedbackDraft.message)}</textarea><button class="primary" ${feedbackBusy||!ready?'disabled':''}>${feedbackBusy?'Sending…':'Send feedback'}</button><p id="feedbackStatus" role="status"></p></form><div id="feedbackList" aria-label="Public feedback"><p class="meta">${ready?'Loading feedback…':'Feedback service is not configured.'}</p></div>${ready?'':`<p class="feedback-setup" role="status">Anonymous feedback is not connected yet. Messages cannot be saved until the site owner connects the feedback service.</p>`}</section>`;
}
async function loadFeedback(){
  const connection=feedbackConnection(),list=document.querySelector('#feedbackList');
  if(!connection||!list)return;
  try{
    const response=await fetch(connection.endpoint,{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error(feedbackServiceError(response.status));
    const rows=await response.json();if(!Array.isArray(rows))throw Error('Invalid feedback response.');
    if(!list.isConnected)return;
    list.innerHTML=rows.length?[...rows].sort((a,b)=>a.created_at.localeCompare(b.created_at)).map(row=>`<article class="feedback-entry"><div class="meta">${esc(row.name||'Anonymous')} · ${esc(new Date(row.created_at).toLocaleString('en-GB'))}</div><p>${esc(row.message)}</p></article>`).join(''):'<p class="meta">No feedback yet. Be the first to share a thought.</p>';
  }catch(error){if(list.isConnected)list.textContent=feedbackRequestError(error);}
}
document.addEventListener('input',event=>{
  if(event.target.id==='feedbackName')feedbackDraft.name=event.target.value;
  if(event.target.id==='feedbackMessage')feedbackDraft.message=event.target.value;
});
document.addEventListener('submit',async event=>{
  if(event.target.id!=='feedbackForm')return;
  event.preventDefault();if(feedbackBusy)return;
  const form=event.target,output=form.querySelector('#feedbackStatus'),button=form.querySelector('button'),connection=feedbackConnection();
  const name=form.elements.name.value.trim(),message=form.elements.message.value.trim(),code=form.elements.code.value;
  if(!connection){output.textContent='Feedback is not configured. Nothing has been saved.';return;}
  if(!message||message.length>2000||name.length>80){output.textContent='Enter feedback between 1 and 2000 characters.';return;}
  feedbackBusy=true;button.disabled=true;output.textContent='Sending…';
  try{
    const response=await fetch(connection.endpoint,{method:'POST',headers:connection.headers,signal:AbortSignal.timeout(15000),body:JSON.stringify({id:feedbackRequestId,visitor_code:code,author:name,feedback:message})});
    if(response.status===409)feedbackRequestId=crypto.randomUUID();
    if(!response.ok)throw Error(feedbackServiceError(response.status));
    const rows=await response.json();if(!Array.isArray(rows)||!rows[0]?.id)throw Error('Save could not be confirmed. Refresh the feedback before sending again.');
    feedbackRequestId=crypto.randomUUID();feedbackDraft.name='';feedbackDraft.message='';form.reset();output.textContent='Feedback saved. Thank you!';await loadFeedback();
  }catch(error){output.textContent=feedbackRequestError(error);}
  finally{feedbackBusy=false;button.disabled=false;}
});
