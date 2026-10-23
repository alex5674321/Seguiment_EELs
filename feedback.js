'use strict';
let feedbackBusy=false;
const feedbackDraft={name:'',message:''};
function feedbackConnection(){
  const config=window.FEEDBACK_CONFIG||{};
  if(!config.url||!config.publicKey)return null;
  try{
    const url=new URL(config.url);
    if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password)return null;
    if(config.publicKey.startsWith('sb_secret_'))return null;
    if(config.publicKey.startsWith('eyJ')){
      const payload=JSON.parse(atob(config.publicKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      if(payload.role!=='anon')return null;
    }else if(!config.publicKey.startsWith('sb_publishable_'))return null;
    const headers={apikey:config.publicKey,'Content-Type':'application/json'};
    if(config.publicKey.startsWith('eyJ'))headers.Authorization=`Bearer ${config.publicKey}`;
    return {endpoint:url.origin+'/rest/v1/journal_feedback',headers};
  }catch{return null;}
}
function feedbackPanel(){
  const ready=!!feedbackConnection();
  return `<section class="panel feedback-section"><div class="section-head"><h2>Feedback</h2><span class="badge">Open to everyone</span></div><p class="meta">Leave a suggestion, question or comment. Enter the shared access code to post. No GitHub account required. Messages are public; please avoid personal information.</p>${ready?`<form id="feedbackForm"><label for="feedbackCode">Access code</label><input id="feedbackCode" name="code" type="password" required autocomplete="off"><label for="feedbackName">Name (optional)</label><input id="feedbackName" name="name" maxlength="80" autocomplete="nickname" value="${esc(feedbackDraft.name)}"><label for="feedbackMessage">Your feedback</label><textarea id="feedbackMessage" name="message" maxlength="2000" required placeholder="What would you like to share?">${esc(feedbackDraft.message)}</textarea><button class="primary" ${feedbackBusy?'disabled':''}>${feedbackBusy?'Sending…':'Send feedback'}</button><p id="feedbackStatus" role="status"></p></form><div id="feedbackList" aria-label="Public feedback"><p class="meta">Loading feedback…</p></div>`:'<p class="feedback-setup" role="status">Anonymous feedback is not connected yet. Messages cannot be saved until the site owner connects Supabase.</p>'}</section>`;
}
async function loadFeedback(){
  const connection=feedbackConnection(),list=document.querySelector('#feedbackList');
  if(!connection||!list)return;
  try{
    const response=await fetch(connection.endpoint+'?select=id,name,message,created_at&order=created_at.desc&limit=50',{headers:connection.headers,cache:'no-store'});
    if(!response.ok)throw Error('Feedback could not be loaded. Please try again later.');
    const rows=await response.json();if(!Array.isArray(rows))throw Error('Invalid feedback response.');
    if(!list.isConnected)return;
    list.innerHTML=rows.length?rows.map(row=>`<article class="feedback-entry"><div class="meta">${esc(row.name||'Anonymous')} · ${esc(new Date(row.created_at).toLocaleString('en-GB'))}</div><p>${esc(row.message)}</p></article>`).join(''):'<p class="meta">No feedback yet. Be the first to share a thought.</p>';
  }catch(error){if(list.isConnected)list.textContent=error.message;}
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
    const response=await fetch(connection.endpoint.replace('/journal_feedback','/rpc/submit_journal_feedback'),{method:'POST',headers:{...connection.headers,Prefer:'return=representation'},body:JSON.stringify({visitor_code:code,author:name,feedback:message})});
    if(!response.ok)throw Error(response.status===403?'Incorrect access code. Feedback was not saved.':'Feedback was not saved. Check the access code and try again.');
    const rows=await response.json();if(!Array.isArray(rows)||!rows[0]?.id)throw Error('Save could not be confirmed. Refresh the feedback before sending again.');
    feedbackDraft.name='';feedbackDraft.message='';form.reset();output.textContent='Feedback saved. Thank you!';await loadFeedback();
  }catch(error){output.textContent=error.message;}
  finally{feedbackBusy=false;button.disabled=false;}
});
