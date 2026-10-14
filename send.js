/* طلاقة · وحدة الإرسال المشتركة — Talaqa shared "send to my teacher" module.
   Used by all tools. Targets live in send-config.json next to this file (no rebuild needed to change them).
   API: window.TalaqaSend.open({tool, grade, section, name, blobs:[{name, blob}], extra:{}})
*/
(function(){
var CFG=null, KEY='tq_send_dest';
function cfg(){if(CFG)return Promise.resolve(CFG);return fetch('send-config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){CFG=c;return c}).catch(function(){CFG={google:'',microsoft:''};return CFG})}
function safe(s){return String(s||'').replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g,'').replace(/\s+/g,'_').slice(0,40)}
function fname(o){var d=new Date(),p=function(n){return (n<10?'0':'')+n};return [safe(o.grade),safe(o.section),safe(o.name),safe(o.tool),d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())].filter(Boolean).join('_')+'.zip'}
function dest(){try{return localStorage.getItem(KEY)||''}catch(e){return ''}}
function setDest(v){try{localStorage.setItem(KEY,v)}catch(e){}}
function css(){if(document.getElementById('tqs-css'))return;var s=document.createElement('style');s.id='tqs-css';s.textContent=
'.tqs-bg{position:fixed;inset:0;background:rgba(29,43,79,.55);z-index:99;display:flex;align-items:flex-end;justify-content:center}'+
'.tqs{background:#fff;color:#1D2B4F!important;border-radius:26px 26px 0 0;padding:18px 18px 26px;width:100%;max-width:560px;font-family:Tajawal,system-ui,sans-serif;direction:rtl;max-height:92vh;overflow:auto}'+
'.tqs h3{margin:0 0 6px;font-size:1.35rem}.tqs p{margin:6px 0;color:#5B6B85;font-size:1rem}.tqs .en{direction:ltr;text-align:left}'+
'.tqs .b{display:block;width:100%;font:inherit;font-weight:800;font-size:1.15rem;border:0;border-radius:16px;padding:14px;margin-top:10px;cursor:pointer;background:#3B6D95;color:#fff;box-shadow:0 4px 0 #24496a;text-align:center;text-decoration:none}'+
'.tqs .b.g{background:#22B866;box-shadow:0 4px 0 #168a4b}.tqs .b.ghost{background:#eef2f6;color:#1D2B4F;box-shadow:0 4px 0 #cfd8e3}.tqs .b:disabled{opacity:.5}'+
'.tqs .step{display:flex;gap:10px;align-items:flex-start;margin:10px 0}.tqs .n{flex:none;width:30px;height:30px;border-radius:50%;background:#FFC83D;color:#5A3A00;font-weight:800;display:flex;align-items:center;justify-content:center}'+
'.tqs .fn{direction:ltr;font-family:monospace;background:#f4f7fa;color:#1D2B4F;border-radius:10px;padding:8px;word-break:break-all;font-size:.9rem;margin:6px 0}.tqs .step b{color:#1D2B4F;font-size:1.05rem}.tqs .step div{flex:1}';document.head.appendChild(s)}
function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstChild}
function close(bg){bg.remove()}
function buildZip(o){if(!window.JSZip)return Promise.reject(new Error('nozip'));var z=new JSZip();o.blobs.forEach(function(b){z.file(b.name,b.blob)});
 z.file('manifest.json',JSON.stringify({tool:o.tool,grade:o.grade,section:o.section,name:o.name,at:new Date().toISOString(),extra:o.extra||{},files:o.blobs.map(function(b){return b.name})},null,1));
 return z.generateAsync({type:'blob'})}
function download(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){a.remove()},2000)}
function open(o){css();if(!o.blobs||!o.blobs.length){alert('لا توجد تسجيلات بعد · No recordings yet');return}
 var name=fname(o),bg=el('<div class="tqs-bg"><div class="tqs"></div></div>'),box=bg.firstChild;document.body.appendChild(bg);
 bg.addEventListener('click',function(e){if(e.target===bg)close(bg)});
 cfg().then(function(c){
  var d=dest(),both=c.google&&c.microsoft,only=c.google?'google':c.microsoft?'microsoft':'';
  if(!d&&!both&&only)d=only;
  if(!d){box.innerHTML='<h3>📤 أرسل إلى معلمي</h3><p>اختر مرة واحدة · Choose once:</p>'+
   (c.google?'<button class="b" data-d="google">عندي حساب Google على هذا الهاتف<br><small>I have a Google account on this phone</small></button>':'')+
   (c.microsoft?'<button class="b" data-d="microsoft">الطالب يدخل بحسابه المدرسي<br><small>The student uses the school (Microsoft) account</small></button>':'')+
   (!c.google&&!c.microsoft?'<p>لم يُفعَّل الإرسال بعد. نزّل الملف وأرسله للمعلمة بنفسك.</p><button class="b ghost" data-d="file">⬇️ نزّل الملف · Download</button>':'<button class="b ghost" data-d="file">أو نزّل الملف فقط · Just download</button>');
   box.querySelectorAll('[data-d]').forEach(function(b){b.onclick=function(){if(b.dataset.d!=='file')setDest(b.dataset.d);go(b.dataset.d)}});return}
  go(d);
  function go(which){var url=which==='google'?c.google:which==='microsoft'?c.microsoft:'';
   box.innerHTML='<h3>📤 أرسل إلى معلمي · Send to my teacher</h3><p>… يجهّز الملف</p>';
   buildZip(o).then(function(blob){
    if(which==='file'){download(blob,name);box.innerHTML='<h3>⬇️ نُزِّل الملف</h3><div class="fn">'+name+'</div><p>أرسله إلى المعلمة عبر واتساب أو تيمز · Send it to the teacher on WhatsApp/Teams</p><button class="b ghost" id="tqs-x">إغلاق · Close</button>';box.querySelector('#tqs-x').onclick=function(){close(bg)};return}
    box.innerHTML='<h3>📤 أرسل إلى معلمي</h3>'+
    '<div class="step"><span class="n">1</span><div><b>نزّل الملف</b> · Download the file<div class="fn">'+name+'</div><button class="b g" id="tqs-dl">⬇️ نزّل · Download</button></div></div>'+
    (url?'<div class="step"><span class="n">2</span><div><b>افتح نموذج الإرسال وارفع الملف</b> · Open the form and upload it<a class="b" id="tqs-go" href="'+url+'" target="_blank" rel="noopener">📨 افتح النموذج · Open form</a></div></div>':
    '<div class="step"><span class="n">2</span><div><b>أرسل الملف إلى المعلمة</b> عبر واتساب أو تيمز · Send it to the teacher on WhatsApp/Teams</div></div>')+
    (both?'<button class="b ghost" id="tqs-sw">تغيير طريقة الإرسال · Change method</button>':'')+'<button class="b ghost" id="tqs-x">إغلاق · Close</button>';
    box.querySelector('#tqs-dl').onclick=function(){
     var f=null;try{f=new File([blob],name,{type:'application/zip'})}catch(e){}
     if(f&&navigator.canShare&&navigator.canShare({files:[f]})&&/Android|iPhone|iPad/i.test(navigator.userAgent)){navigator.share({files:[f],title:name}).catch(function(){download(blob,name)})}else download(blob,name)};
    var sw=box.querySelector('#tqs-sw');if(sw)sw.onclick=function(){setDest('');close(bg);open(o)};
    box.querySelector('#tqs-x').onclick=function(){close(bg)};
   }).catch(function(){box.innerHTML='<h3>تعذّر تجهيز الملف</h3><p>تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى.</p><button class="b ghost" id="tqs-x">إغلاق</button>';box.querySelector('#tqs-x').onclick=function(){close(bg)}})}
 })}
window.TalaqaSend={open:open,fname:fname};
})();
