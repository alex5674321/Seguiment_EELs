'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ready=!!feedbackConnection();
document.querySelector('#feedbackForm button').disabled=!ready;
document.querySelector('#feedbackStatus').textContent=ready?'Enter the access code above, then write your message.':'Feedback service is not configured yet. You can write a draft, but it cannot be saved.';
if(ready)loadFeedback();
