'use strict';
let feedbackBusy=false;
const feedbackDraft={name:'',message:''};
let feedbackRequestId=crypto.randomUUID();
function feedbackConnection(){
  try{const url=new URL(window.FEEDBACK_CONFIG?.endpoint);if(url.protocol!=='https:'||url.username||url.password)return null;return {endpoint:url.href,headers:{'Content-Type':'application/json'}};}catch{return null;}
}
function feedbackServiceError(code){return ({403:'Incorrect access code. Feedback was not saved.',404:'Feedback endpoint not found. The site owner needs to check the Worker URL.',409:'Feedback was not saved. Please press Send again.',503:'Feedback service needs setup. The site owner must configure GITHUB_TOKEN and FEEDBACK_CODE in Cloudflare.',502:'Feedback cannot connect to GitHub. The site owner needs to check the Worker token and repository permissions.'})[code]||`Feedback was not saved (HTTP ${code}). Please try again later.`;}
async function feedbackResponseError(response){
  let body;try{body=await response.json();}catch{}
  const messages={GITHUB_TOKEN_INVALID:'The Worker GitHub token is invalid or expired. Update the GITHUB_TOKEN secret in Cloudflare.',GITHUB_PERMISSION_DENIED:'GitHub denied access. Give the Worker token access to Seguiment_EELs with Contents: Read and write.',GITHUB_RATE_LIMITED:'GitHub rate limit reached. Please try again later.',GITHUB_REPOSITORY_UNAVAILABLE:'The Worker cannot access the repository. Check the token repository selection.',GITHUB_UPSTREAM_ERROR:'GitHub is temporarily unavailable. Please try again later.'};
  return messages[body?.code]||feedbackServiceError(response.status);
}
function feedbackRequestError(error){if(error.name==='TimeoutError'||error.name==='AbortError')return 'Feedback took too long to respond. Check your connection and try again; your message is kept.';if(error instanceof TypeError)return 'Cannot reach the feedback service. Check your connection. The site owner should also check the Worker URL and allowed origin.';return error.message;}
let feedbackRows=null;
let feedbackInboxOpen=false;
let feedbackReading=new Set();
try{feedbackReading=new Set(JSON.parse(localStorage.getItem('eel-feedback-read:'+window.FEEDBACK_CONFIG?.endpoint)||'[]'));}catch{}
const feedbackIsEditor=()=>typeof token!=='undefined'&&!!token;
function updateFeedbackBadges(){
  const editor=feedbackIsEditor();
  const unread=feedbackRows?.filter(row=>!row.hidden&&!feedbackReading.has(row.id)).length;
  document.querySelectorAll('[data-feedback-unread]').forEach(b=>{b.hidden=!editor;b.textContent=unread===undefined?'Checking…':unread?`${unread} unread`:'All read';b.classList.toggle('has-unread',!!unread);});
  document.querySelectorAll('.housekeeping-unread').forEach(b=>{b.textContent=unread||'';b.hidden=!editor||!unread;});
}
function markFeedbackRead(ids){
  if(!feedbackIsEditor())return;
  ids.forEach(id=>feedbackReading.add(id));
  try{localStorage.setItem('eel-feedback-read:'+window.FEEDBACK_CONFIG?.endpoint,JSON.stringify([...feedbackReading].slice(-2000)));}catch{}
  document.querySelectorAll('[data-feedback-read]').forEach(entry=>{const read=feedbackReading.has(entry.dataset.feedbackRead);entry.classList.toggle('is-unread',feedbackIsEditor()&&!read);const badge=entry.querySelector('.feedback-new');if(badge)badge.hidden=!feedbackIsEditor()||read;const button=entry.closest('.feedback-card')?.querySelector('[data-feedback-mark-read]');if(button){button.disabled=read;button.textContent=read?'Read':'Mark as read';}});
  updateFeedbackBadges();
}
function renderFeedbackList(){
  const list=document.querySelector('#feedbackList');if(!list||!feedbackRows)return;
  const visibleRows=feedbackRows.filter(row=>feedbackIsEditor()||!row.hidden);
  list.innerHTML=visibleRows.length?[...visibleRows].sort((a,b)=>a.created_at.localeCompare(b.created_at)).map(row=>`<article class="feedback-card ${row.hidden?'feedback-hidden':''}"><details class="feedback-entry ${feedbackIsEditor()&&!feedbackReading.has(row.id)?'is-unread':''}" data-feedback-read="${esc(row.id)}"><summary>${row.hidden?'<span class="badge">Hidden</span>':''}<span class="feedback-new" ${!feedbackIsEditor()||feedbackReading.has(row.id)?'hidden':''}>New</span><span>${esc(row.name||'Anonymous')}</span><span class="meta">${esc(new Date(row.created_at).toLocaleString('en-GB'))}</span><span class="feedback-preview">${esc(row.message.slice(0,100))}</span></summary><p>${esc(row.message)}</p>${row.edited_at?`<p class="meta">Edited ${esc(new Date(row.edited_at).toLocaleString('en-GB'))}</p>`:''}</details>${typeof token!=='undefined'&&token?`<div class="feedback-card-actions"><button type="button" class="small" data-feedback-mark-read="${esc(row.id)}" ${feedbackReading.has(row.id)?'disabled':''}>${feedbackReading.has(row.id)?'Read':'Mark as read'}</button><button type="button" class="small" data-edit-feedback="${esc(row.id)}">Edit feedback</button><button type="button" class="small" data-visibility-feedback="${esc(row.id)}">${row.hidden?'Show feedback':'Hide feedback'}</button><button type="button" class="small danger" data-delete-feedback="${esc(row.id)}">Delete feedback</button></div>`:''}</article>`).join(''):'<p class="meta">No feedback yet.</p>';
  updateFeedbackBadges();
}
function feedbackPanel(){
  const ready=!!feedbackConnection();
  return `<section class="panel feedback-section feedback-inbox-panel"><details id="feedbackInbox" ${feedbackInboxOpen||feedbackIsEditor()?'open':''}><summary class="feedback-inbox-heading"><strong>Feedback inbox</strong><span class="badge" data-feedback-unread>Checking…</span><span class="meta">Open to read messages</span></summary><div class="feedback-inbox-actions"><button type="button" class="small" data-feedback-refresh>Refresh feedback</button><button type="button" class="small edit-only" data-feedback-mark-all>Mark all as read</button></div><p class="meta edit-only">Only you can mark feedback as read in Edit mode. Read status is saved in this browser.</p><div id="feedbackList" aria-label="Public feedback"><p class="meta">${ready?'Loading feedback…':'Feedback service is not configured.'}</p></div></details><details class="feedback-compose"><summary>Leave feedback</summary><p class="meta">Enter the shared access code to post. Messages are public.</p><form id="feedbackForm"><label for="feedbackCode">Access code</label><input id="feedbackCode" name="code" type="password" required autocomplete="off"><label for="feedbackName">Name (optional)</label><input id="feedbackName" name="name" maxlength="80" autocomplete="nickname" value="${esc(feedbackDraft.name)}"><label for="feedbackMessage">Your feedback</label><textarea id="feedbackMessage" name="message" maxlength="2000" required placeholder="What would you like to share?">${esc(feedbackDraft.message)}</textarea><button class="primary" ${feedbackBusy||!ready?'disabled':''}>${feedbackBusy?'Sending…':'Send feedback'}</button><p id="feedbackStatus" role="status"></p></form></details>${ready?'':`<p class="feedback-setup" role="status">Feedback is not connected yet. Messages cannot be saved until the site owner connects the feedback service.</p>`}</section>`;
}
let feedbackLoading=null;
async function loadFeedback(){
  const connection=feedbackConnection();if(!connection)return;
  if(feedbackLoading)return feedbackLoading;
  feedbackLoading=(async()=>{try{
    const response=await fetch(connection.endpoint,{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error(await feedbackResponseError(response));
    const rows=await response.json();if(!Array.isArray(rows)||rows.some(row=>typeof row.id!=='string'||typeof row.message!=='string'||typeof row.created_at!=='string'))throw Error('Invalid feedback response.');
    feedbackRows=rows;renderFeedbackList();updateFeedbackBadges();
  }catch(error){const list=document.querySelector('#feedbackList');if(list)list.textContent=feedbackRequestError(error);document.querySelectorAll('[data-feedback-unread]').forEach(b=>b.textContent='Unavailable');}
  finally{feedbackLoading=null;}})();return feedbackLoading;
}
document.addEventListener('toggle',event=>{
  if(event.target.id==='feedbackInbox')feedbackInboxOpen=event.target.open;
},true);
document.addEventListener('click',event=>{
  if(event.target.closest('[data-feedback-mark-all]'))markFeedbackRead((feedbackRows||[]).map(row=>row.id));
  const read=event.target.closest('[data-feedback-mark-read]');if(read)markFeedbackRead([read.dataset.feedbackMarkRead]);
  if(event.target.closest('[data-feedback-refresh]'))loadFeedback();
  const visibility=event.target.closest('[data-visibility-feedback]');if(visibility&&typeof feedbackEditForm==='function'){const row=feedbackRows?.find(row=>row.id===visibility.dataset.visibilityFeedback);if(row)feedbackEditForm(row.id,false,!row.hidden);}
  const remove=event.target.closest('[data-delete-feedback]');if(remove&&typeof feedbackEditForm==='function')feedbackEditForm(remove.dataset.deleteFeedback,true);
  const edit=event.target.closest('[data-edit-feedback]');if(edit&&typeof feedbackEditForm==='function')feedbackEditForm(edit.dataset.editFeedback);
});
window.addEventListener('storage',event=>{if(event.key==='eel-feedback-read:'+window.FEEDBACK_CONFIG?.endpoint){try{feedbackReading=new Set(JSON.parse(event.newValue||'[]'));renderFeedbackList();}catch{}}});
setInterval(()=>{if(document.visibilityState==='visible')loadFeedback();},60000);
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
    if(!response.ok)throw Error(await feedbackResponseError(response));
    const rows=await response.json();if(!Array.isArray(rows)||!rows[0]?.id)throw Error('Save could not be confirmed. Refresh the feedback before sending again.');
    feedbackRequestId=crypto.randomUUID();feedbackDraft.name='';feedbackDraft.message='';form.reset();output.textContent='Feedback saved. Thank you!';await loadFeedback();
  }catch(error){output.textContent=feedbackRequestError(error);}
  finally{feedbackBusy=false;button.disabled=false;}
});
