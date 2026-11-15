/* طلاقة · تجميد الأدوات (freeze.js)
   المنسق يوقف أداة أو أكثر مؤقتًا من لوحته: للمنصة كلها، أو لصف، أو لشعبة، ثم يفك التجميد.
   - الحالة محفوظة في خادم المدرسة (Google Apps Script، الخاصية FREEZE)، وتقرؤها كل صفحة عند فتحها.
   - إن تعذّر الاتصال بالخادم تبقى الأدوات مفتوحة (لا يتعطل الطلاب بسبب عطل في الخادم).
   - التجميد حاجز تنظيمي لا أمني: يمنع الاستخدام العادي، ولا يُعتمد عليه وسيلةَ حماية.
   - لا يغيّر تقدّم الطلاب ولا يحذف شيئًا. المعاينة والمعلم والمنسق لا يتأثرون. */
(function(){
'use strict';
if(window.__tqFz)return;window.__tqFz=true;
var TOOLS=[['read','القراءة'],['speak','التحدث'],['listen','الاستماع'],['imla','الإملاء'],['ws','ورشة الكتابة'],['write','أكتب'],['games','الألعاب']];
var TNAME={};TOOLS.forEach(function(t){TNAME[t[0]]=t[1]});
var path=location.pathname,file=(path.split('/').pop()||'index.html').toLowerCase(),inB=/\/b\/(index\.html)?$/.test(path);
function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

/* ---------- أي صفحة هذه؟ ---------- */
var GM=/^grade-([a-z0-9]+)\.html$/.exec(file),PAGE=null,PGRADE=null;
if(/^rec/.test(file))return;                                   /* استوديوهات التسجيل للمعلمين */
if(GM){PAGE='grade';PGRADE=/^kg/.test(GM[1])?'KG':GM[1].toUpperCase()}
else if(file==='listen.html'||/^aal-(kg\d?|g\d)\.html$/.test(file))PAGE='listen';
else if(/^aal-r-/.test(file))PAGE='speak';
else if(file==='bsk.html')PAGE=/[?&]k=write/.test(location.search)?'write':'read';
else if(file==='imla.html')PAGE='imla';
else if(file==='ws.html')PAGE='ws';
else if(file==='write.html'||file==='kgw.html')PAGE='write';
else if(file==='games.html')PAGE='games';
else if(file==='index.html'||file==='')PAGE='portal';
if(!PAGE)return;
var BTRACK=inB||/^aal-|^bsk\.html$/.test(file);
function toolOfHref(h){h=String(h||'');
 if(/grade-[a-z0-9]+\.html/.test(h))return /tab=speak/.test(h)?'speak':'read';
 if(/aal-r-/.test(h))return 'speak';if(/aal-/.test(h)||/listen\.html/.test(h))return 'listen';
 if(/bsk\.html/.test(h))return /k=write/.test(h)?'write':'read';
 if(/imla\.html/.test(h))return 'imla';if(/ws\.html/.test(h))return 'ws';if(/(write|kgw)\.html/.test(h))return 'write';if(/games\.html/.test(h))return 'games';return null}

/* ---------- من الطالب؟ ---------- */
function gradeOf(sec){var s=String(sec||'').toUpperCase(),m=/^G(\d)/.exec(s);return /^KG/.test(s)?'KG':m?'G'+m[1]:null}
function who(){
 var a=get('pt_me',null),b=get('ptb_me',null),g=PGRADE?(get('gs_me_'+GM[1].toUpperCase(),null)):null;
 var me=(BTRACK?(b||a):(a||b))||null;
 if(window.__pv||(me&&me.pv)||(g&&g.sec==='معاينة'))return {staff:true};
 var sec=(g&&g.sec)||(me&&me.sec)||null;
 return {sec:sec,grade:PGRADE||gradeOf(sec)}}

/* ---------- ما المجمَّد لهذا الطالب؟ ---------- */
function frozenFor(fz,w){var set={},msg='',any=false;
 if(!fz||!fz.rules||w.staff)return {set:set,msg:'',any:false};
 fz.rules.forEach(function(r){if(!(r.s==='all'||(w.grade&&r.s===w.grade)||(w.sec&&r.s===w.sec)))return;
  (r.t||[]).forEach(function(t){if(t==='*')TOOLS.forEach(function(x){set[x[0]]=1});else set[t]=1});any=true;if(!msg&&r.m)msg=r.m});
 return {set:set,msg:msg,any:any}}

/* ---------- العرض ---------- */
var CSS='html.tqfz-page body>*:not(#tqfz-box){display:none!important}'+
'#tqfz-box,.tqfz-card{max-width:520px;margin:48px auto;background:#fff;color:#14204A;text-shadow:none;border:2px solid #C8963E;border-radius:26px;padding:26px 20px;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.35);font-weight:700;line-height:1.7}'+
'#tqfz-box b,.tqfz-card b{display:block;font-size:1.5rem;font-weight:800;margin-bottom:6px}#tqfz-box .ic{font-size:3.2rem;line-height:1.2}'+
'#tqfz-box a{display:inline-block;margin-top:16px;background:#14804A;color:#fff;border-radius:18px;padding:12px 24px;font-weight:800;text-decoration:none;box-shadow:0 5px 0 #0C5A33}'+
'html.tqfz-read #app-read>*,html.tqfz-speak #app-speak>*{display:none!important}'+
'html.tqfz-read #app-read::before,html.tqfz-speak #app-speak::before{content:"🧊  " attr(data-tqfz);display:block;white-space:pre-line;max-width:520px;margin:36px auto;background:#fff;color:#14204A;text-shadow:none;border:2px solid #C8963E;border-radius:26px;padding:26px 20px;text-align:center;font-weight:800;font-size:1.15rem;line-height:1.8}'+
'.tqfz-off{opacity:.45;filter:grayscale(1);pointer-events:none;position:relative}'+
'.tqfz-note{background:#FFF1CC;color:#5A3A00;text-shadow:none;border-radius:16px;padding:10px 14px;font-weight:800;margin:10px 0;text-align:center}'+
'#tqfz-admin{background:#fff;color:#14204A;text-shadow:none;border:2px solid #C8963E;border-radius:22px;padding:14px 16px;margin:0 0 16px;--ink:#14204A;--muted:#575E7A}'+
'#tqfz-admin summary{font-weight:800;cursor:pointer;font-size:1.1rem}#tqfz-admin h3{margin:14px 0 6px;font-size:1rem}'+
'#tqfz-admin .r{display:flex;gap:8px;flex-wrap:wrap;align-items:center}#tqfz-admin label.c{display:inline-flex;align-items:center;gap:6px;background:#FBF5E9;border-radius:12px;padding:6px 10px;font-weight:700;cursor:pointer}'+
'#tqfz-admin select,#tqfz-admin input[type=text]{font:inherit;border:2px solid #E9DCC0;border-radius:12px;padding:8px 10px;background:#FFFDF8;color:#14204A;max-width:100%}'+
'#tqfz-admin button{font:inherit;font-weight:800;border:0;border-radius:14px;padding:9px 16px;cursor:pointer;background:#14804A;color:#fff}#tqfz-admin button.x{background:#C8102E}#tqfz-admin button[disabled]{opacity:.5}'+
'#tqfz-admin ul{list-style:none;padding:0;margin:6px 0}#tqfz-admin li{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:#EEF4FF;border-radius:12px;padding:8px 10px;margin:6px 0;font-weight:700}'+
'#tqfz-admin .n{color:#575E7A;font-size:.9rem;font-weight:600;margin:6px 0 0}';
function css(){if(document.getElementById('tqfz-css'))return;var s=document.createElement('style');s.id='tqfz-css';s.textContent=CSS;document.head.appendChild(s)}
function portalUrl(){return BTRACK?'/b/':'/index.html'}
var DEF='هذه الأداة متوقفة مؤقتًا بقرار من قسم اللغة العربية. تقدّمك محفوظ، وتعود الأداة عند فتحها من جديد.';
function blockPage(msg){css();document.documentElement.classList.add('tqfz-page');
 var b=document.getElementById('tqfz-box');if(!b){b=document.createElement('div');b.id='tqfz-box';b.setAttribute('role','alert');document.body.appendChild(b)}
 b.innerHTML='<div class="ic" aria-hidden="true">🧊</div><b>الأداة متوقفة مؤقتًا</b><div>'+esc(msg||DEF)+'</div><a href="'+portalUrl()+'">العودة إلى أدواتي</a>'}
function unblockPage(){document.documentElement.classList.remove('tqfz-page');var b=document.getElementById('tqfz-box');if(b)b.remove()}
function applyGrade(f){var H=document.documentElement,r=!!f.set.read,s=!!f.set.speak;
 if(r&&s){H.classList.remove('tqfz-read','tqfz-speak');blockPage(f.msg);return}
 unblockPage();css();
 [['read',r,'القراءة'],['speak',s,'التحدث']].forEach(function(x){var el=document.getElementById('app-'+x[0]);H.classList.toggle('tqfz-'+x[0],x[1]);
  if(el&&x[1])el.setAttribute('data-tqfz',x[2]+' متوقفة مؤقتًا\n'+(f.msg||'تقدّمك محفوظ، وتعود الأداة عند فتحها من جديد.'))})}
function applyPortal(f){var root=document.getElementById('app');if(!root)return;css();
 var links=[].slice.call(root.querySelectorAll('a.tqi,a.tool')),n=0;
 links.forEach(function(a){var h=a.getAttribute('href')||a.getAttribute('data-tqfz-h'),t=toolOfHref(h),off=!!(t&&f.set[t]);
  if(off){n++;if(a.hasAttribute('href')){a.setAttribute('data-tqfz-h',a.getAttribute('href'));a.removeAttribute('href')}a.classList.add('tqfz-off');a.setAttribute('aria-disabled','true')}
  else if(a.classList.contains('tqfz-off')){a.classList.remove('tqfz-off');a.removeAttribute('aria-disabled');if(a.getAttribute('data-tqfz-h')){a.setAttribute('href',a.getAttribute('data-tqfz-h'));a.removeAttribute('data-tqfz-h')}}});
 var note=root.querySelector('.tqfz-note');
 if(n&&links.length){var txt='🧊 '+(n===links.length?'الأدوات متوقفة مؤقتًا':'بعض الأدوات متوقفة مؤقتًا')+(f.msg?' · '+f.msg:'');
  if(!note){note=document.createElement('p');note.className='tqfz-note';var w=root.querySelector('.tqi-wrap')||links[0].parentNode;w.parentNode.insertBefore(note,w)}
  if(note.textContent!==txt)note.textContent=txt}
 else if(note)note.remove()}
var FZ=null;
function apply(){var f=frozenFor(FZ,who());
 if(PAGE==='portal'){applyPortal(f);admin();return}
 if(PAGE==='grade'){applyGrade(f);return}
 if(f.set[PAGE])blockPage(f.msg);else unblockPage()}

/* ---------- القراءة من الخادم (مع نسخة محلية قصيرة العمر) ---------- */
var URL_=null;
function serverUrl(){if(URL_!==null)return Promise.resolve(URL_);
 return fetch('/send-config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){URL_=String(c.progress||'');return URL_}).catch(function(){URL_='';return ''})}
function load(){var c=get('tq_fz',null),now=Date.now();
 if(c&&c.d&&now-c.at<12*3600*1000){FZ=c.d;apply()}            /* نسخة محلية: تسري فورًا، وتسقط بعد 12 ساعة */
 serverUrl().then(function(u){if(!u)return;
  return fetch(u+'?a=fz&t='+now).then(function(r){return r.json()}).then(function(j){
   if(j&&j.ok&&j.fz){FZ=j.fz;put('tq_fz',{at:Date.now(),d:FZ});apply()}})}).catch(function(){})}

/* ---------- لوحة المنسق ---------- */
var ST={open:false,scope:'all',tools:{},msg:'',busy:false,err:''};
function seedData(){try{return JSON.parse(document.getElementById('seed').textContent)}catch(e){return null}}
function scopeName(s){return s==='all'?'المنصة كلها':/^(KG|G\d)$/.test(s)?'الصف: '+s:'الشعبة: '+s}
function toolsName(t){return (t||[]).indexOf('*')>=0?'كل الأدوات':(t||[]).map(function(x){return TNAME[x]||x}).join('، ')}
function save(rules){var q=window.__tqLQ;if(!q||q.r!=='own')return;ST.busy=true;ST.err='';admin(true);
 serverUrl().then(function(u){if(!u)throw new Error('off');
  return fetch(u+'?a=fzset&r=own&k='+encodeURIComponent(q.k)+'&v='+encodeURIComponent(JSON.stringify({rules:rules}))).then(function(r){return r.json()})})
 .then(function(j){ST.busy=false;if(j&&j.ok&&j.fz){FZ=j.fz;put('tq_fz',{at:Date.now(),d:FZ})}else ST.err=(j&&j.err==='auth')?'رمز المنسق غير مقبول من الخادم.':'الخادم لم يُحدَّث بعد: الصق ملف الخادم الجديد في Apps Script وأعد نشره.';admin(true);apply()})
 .catch(function(){ST.busy=false;ST.err='تعذّر الاتصال بالخادم. لم يتغيّر شيء.';admin(true)})}
function admin(force){
 if(PAGE!=='portal'||inB)return;var q=window.__tqLQ,root=document.getElementById('app');if(!root)return;
 var h1=root.querySelector('h1'),isOwner=!!(q&&q.r==='own'&&h1&&/لوحة المنسق/.test(h1.textContent)),box=document.getElementById('tqfz-admin');
 if(!isOwner){if(box)box.remove();return}
 if(box&&!force)return;css();
 var D=seedData()||{},secs=Object.keys(D.secs||{}).sort(),grades=(D.grades||[]).map(function(g){return g.id}),rules=(FZ&&FZ.rules)||[];
 var h='<summary>🧊 تجميد الأدوات'+(rules.length?' · '+rules.length+' مفعّل':'')+'</summary>'+
 '<p class="n">يوقف أداة أو أكثر مؤقتًا. يسري عند فتح الطالب للصفحة في المرة التالية، وتقدّمه محفوظ.</p>'+
 '<h3>المجمَّد الآن</h3>'+(rules.length?'<ul>'+rules.map(function(r,i){return '<li><span>'+esc(scopeName(r.s))+' · '+esc(toolsName(r.t))+(r.m?' · «'+esc(r.m)+'»':'')+'</span><button class="x" data-fz="del" data-i="'+i+'"'+(ST.busy?' disabled':'')+'>فك التجميد</button></li>'}).join('')+'</ul>'+(rules.length>1?'<button class="x" data-fz="clear"'+(ST.busy?' disabled':'')+'>فك كل التجميد</button>':''):'<p class="n">لا شيء مجمَّد.</p>')+
 '<h3>تجميد جديد</h3><div class="r"><label>النطاق <select data-fz="scope"><option value="all">المنصة كلها</option>'+
 '<optgroup label="صف">'+grades.map(function(g){return '<option value="'+esc(g)+'">الصف: '+esc(g)+'</option>'}).join('')+'</optgroup>'+
 '<optgroup label="شعبة">'+secs.map(function(s){return '<option value="'+esc(s)+'">'+esc(s)+'</option>'}).join('')+'</optgroup></select></label></div>'+
 '<div class="r" style="margin-top:8px"><label class="c"><input type="checkbox" data-fz="t" value="*"> كل الأدوات</label>'+TOOLS.map(function(t){return '<label class="c"><input type="checkbox" data-fz="t" value="'+t[0]+'"> '+t[1]+'</label>'}).join('')+'</div>'+
 '<div class="r" style="margin-top:8px"><input type="text" data-fz="msg" maxlength="160" placeholder="رسالة تظهر للطلاب (اختياري)" style="flex:1;min-width:200px"><button data-fz="add"'+(ST.busy?' disabled':'')+'>'+(ST.busy?'⏳ يُحفظ…':'🧊 جمّد')+'</button></div>'+
 (ST.err?'<p class="n" style="color:#C8102E">'+esc(ST.err)+'</p>':'');
 if(!box){box=document.createElement('details');box.id='tqfz-admin';var lead=root.querySelector('p.lead')||h1;lead.parentNode.insertBefore(box,lead.nextSibling);
  box.addEventListener('toggle',function(){ST.open=box.open});
  box.addEventListener('change',function(e){var t=e.target,k=t.getAttribute('data-fz');if(k==='scope')ST.scope=t.value;if(k==='msg')ST.msg=t.value;
   if(k==='t'){if(t.value==='*'&&t.checked){ST.tools={'*':1}}else if(t.checked){delete ST.tools['*'];ST.tools[t.value]=1}else delete ST.tools[t.value];sync()}});
  box.addEventListener('input',function(e){if(e.target.getAttribute('data-fz')==='msg')ST.msg=e.target.value});
  box.addEventListener('click',function(e){var b=e.target.closest('button[data-fz]');if(!b||ST.busy)return;e.preventDefault();e.stopPropagation();
   var k=b.getAttribute('data-fz'),cur=((FZ&&FZ.rules)||[]).slice();
   if(k==='del'){cur.splice(Number(b.getAttribute('data-i')),1);save(cur)}
   else if(k==='clear'){save([])}
   else if(k==='add'){var ts=Object.keys(ST.tools);if(!ts.length){ST.err='اختر أداة واحدة على الأقل.';admin(true);return}
    cur=cur.filter(function(r){return r.s!==ST.scope});cur.push({s:ST.scope,t:ts,m:ST.msg.trim(),at:new Date().toISOString().slice(0,10)});ST.tools={};ST.msg='';save(cur)}})}
 box.innerHTML=h;box.open=ST.open;sync();
 function sync(){var s=box.querySelector('[data-fz=scope]');if(s)s.value=ST.scope;var m=box.querySelector('[data-fz=msg]');if(m&&m.value!==ST.msg)m.value=ST.msg;
  [].forEach.call(box.querySelectorAll('[data-fz=t]'),function(c){c.checked=!!ST.tools[c.value]})}}

/* ---------- التشغيل ---------- */
function start(){load();
 if(PAGE==='portal'||PAGE==='grade'){var t=null;try{new MutationObserver(function(){if(t)return;t=setTimeout(function(){t=null;try{apply()}catch(e){}},60)}).observe(document.getElementById('app')||document.body,{childList:true,subtree:PAGE==='portal'})}catch(e){}}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.TQFreeze={reload:load};
})();
