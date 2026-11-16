/* طلاقة · التثبيت كتطبيق والدخول الدائم (app.js)
   - بعد أن يدخل الطالب (ببطاقة QR أو برقمه) تظهر له دعوة «ثبّت طلاقة على جهازك» بالخطوات المناسبة لجهازه.
   - أندرويد والحاسوب: زر «تثبيت» مباشر (manifest.json). دخول الطالب محفوظ في الجهاز فيبقى داخلًا.
   - آيفون وآيباد: التطبيق المثبَّت له ذاكرة منفصلة عن Safari، لذلك نُبقي رقم الطالب في عنوان الصفحة (‎?id=‎)
     ليُحفظ مع الأيقونة عند «إضافة إلى الشاشة الرئيسية»، فيدخل الطالب من الأيقونة مباشرة في كل مرة.
     الأيقونة إذن تساوي بطاقة QR: من يحمل الجهاز يدخل باسم الطالب.
   - المعلم والمنسق: تظهر لهما دعوة التثبيت نفسها، والأيقونة تفتح على شاشة دخولهما مباشرة.
     «تذكّرني على هذا الجهاز» اختياري: يحفظ الرمز في هذا الجهاز فقط، وزر «خروج» يمسحه.
     لا يُفعَّل إلا على جهاز شخصي مقفل، لأن الرمز يفتح بيانات الطلاب.
   - لا متجر، ولا خادم، ولا تخزين مؤقت للملفات (حتى تصل التحديثات فورًا). */
(function(){
'use strict';
if(window.__tqApp)return;window.__tqApp=true;
var inB=/\/b\/(index\.html)?$/.test(location.pathname),KEY=inB?'ptb_me':'pt_me',ua=navigator.userAgent||'';
var IOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
var SAFARI=IOS&&!/CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|Line\/|Snapchat|GSA\//.test(ua);
function standalone(){try{return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches}catch(e){return false}}
function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function me(){var m=get(KEY,null);return m&&m.p&&!m.pv?m:null}

/* ملف التعريف: لغير أجهزة آبل فقط (على آبل يمنع حفظ رقم الطالب مع الأيقونة) */
if(!IOS){try{var l=document.createElement('link');l.rel='manifest';l.href=inB?'/b/manifest.json':'/manifest.json';document.head.appendChild(l)}catch(e){}}

/* ---------- المعلم والمنسق ---------- */
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function rootEl(){return document.getElementById('app')}
function staffView(){var r=rootEl();if(!r)return null;
 if(r.querySelector('#fTeach,[data-a="tout"]'))return 't';
 if(r.querySelector('#fOwn,[data-a="oout"]'))return 'own';
 var h=r.querySelector('h1');return h&&/لوحة المنسق/.test(h.textContent)?'own':null}
function staffIn(role){var r=rootEl();if(!r)return false;
 if(role==='t')return !r.querySelector('#fTeach')&&!!r.querySelector('[data-a="tout"]');
 var h=r.querySelector('h1');return !r.querySelector('#fOwn')&&!!h&&/لوحة المنسق/.test(h.textContent)}
try{var go=/[?&]go=(t|own)\b/.exec(location.search);if(go)put('tq_role',go[1])}catch(e){}   /* أيقونة آبل للمعلم/المنسق */
/* رموز QR للعرض والتوزيع: ‎#t‎ يفتح دخول المعلم، و‎#o‎ يفتح دخول المنسق (مرة واحدة، دون حفظ أي رمز) */
var qrRole=null;try{var hq=/^#(t|o)$/.exec(location.hash);if(hq){qrRole=hq[1]==='t'?'t':'own';history.replaceState(history.state,'',location.pathname+location.search)}}catch(e){}
if(window.__qr)del('tq_role');                                                               /* الجهاز استُخدم ببطاقة طالب */
var routed=false,tried={},pending=null;
function staff(){var r=rootEl();if(!r)return;
 /* 1) الأيقونة تفتح على شاشة الدخول مباشرة */
 if(!routed){var role=qrRole||get('tq_role',null),b=role&&r.querySelector('.foot [data-a="'+(role==='t'?'tin':'oin')+'"]');
  if(b){routed=true;b.click();return}if(r.querySelector('.foot')||staffView())routed=true}
 /* 2) خانة «تذكّرني» + الدخول التلقائي إن كان الرمز محفوظًا */
 var f=r.querySelector('#fTeach,#fOwn');if(!f)return;var fr=f.id==='fTeach'?'t':'own',saved=get('tq_staff',{})||{},c=saved[fr];
 if(!f.querySelector('#tq-rem')){var lab=document.createElement('label');lab.className='chk';lab.id='tq-rem';
  lab.innerHTML='<input type="checkbox"'+(c?' checked':'')+'> تذكّرني على هذا الجهاز <small style="font-weight:600">(لجهازك الشخصي فقط)</small>';
  var sb=f.querySelector('button[type=submit]');f.insertBefore(lab,sb);
  if(fr==='t'){var last=c?c.id:get('tq_tid',null),sel=f.querySelector('#tSel');if(last&&sel)sel.value=last}}
 if(c&&!tried[fr]){tried[fr]=true;
  if(fr==='t'){var s1=f.querySelector('#tSel'),p1=f.querySelector('#tPin');if(s1)s1.value=c.id;if(p1)p1.value=c.pin}
  else{var p2=f.querySelector('#oPin');if(p2)p2.value=c.k}
  pending={role:fr,auto:true,rem:true,id:c.id,pin:fr==='t'?c.pin:c.k};
  try{if(f.requestSubmit)f.requestSubmit();else f.querySelector('button[type=submit]').click()}catch(e){}
  setTimeout(settle,500)}}
function settle(){var p=pending;if(!p)return;pending=null;var saved=get('tq_staff',{})||{};
 if(staffIn(p.role)){put('tq_role',p.role);if(p.role==='t')put('tq_tid',p.id);
  if(p.rem)saved[p.role]=p.role==='t'?{id:p.id,pin:p.pin}:{k:p.pin};else delete saved[p.role];put('tq_staff',saved)}
 else if(p.auto){delete saved[p.role];put('tq_staff',saved)}                                  /* الرمز المحفوظ لم يعد صالحًا */
 tick()}
document.addEventListener('submit',function(e){var f=e.target;if(!f||(f.id!=='fTeach'&&f.id!=='fOwn')||(pending&&pending.auto))return;
 var rem=f.querySelector('#tq-rem input');
 pending=f.id==='fTeach'?{role:'t',id:(f.querySelector('#tSel')||{}).value,pin:String((f.querySelector('#tPin')||{}).value||'').trim().toUpperCase().replace(/\s+/g,''),rem:!!(rem&&rem.checked)}
  :{role:'own',pin:String((f.querySelector('#oPin')||{}).value||'').trim(),rem:!!(rem&&rem.checked)};
 setTimeout(settle,500)},true);
document.addEventListener('click',function(e){var b=e.target.closest?e.target.closest('[data-a="tout"],[data-a="oout"]'):null;if(!b)return;
 var role=b.getAttribute('data-a')==='tout'?'t':'own',saved=get('tq_staff',{})||{};delete saved[role];put('tq_staff',saved);del('tq_role');tried[role]=true},true);

/* آبل: عنوان الصفحة يحمل رقم الطالب ما دام داخلًا، ويُزال عند خروجه */
function syncUrl(){if(!IOS||standalone())return;
 try{var m=me(),sv=staffView(),want=location.pathname+(sv?'?go='+sv:m?'?id='+encodeURIComponent(m.p):'');
  if(location.hash&&/(id|me|pl|demo)=?/.test(location.hash))return;               /* الصفحة ما زالت تعالج رابط الدخول */
  if(location.pathname+location.search!==want)history.replaceState(history.state,'',want+location.hash)}catch(e){}}

/* زر التثبيت في أندرويد والحاسوب */
var deferred=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;paint()});
window.addEventListener('appinstalled',function(){deferred=null;put('tq_app_done',1);paint()});

var CSS='#tq-app{background:#fff;color:#14204A;text-shadow:none;border:2px solid #C8963E;border-radius:22px;padding:14px 16px;margin:10px 0 14px;box-shadow:0 10px 26px rgba(0,0,0,.3);font-weight:700;line-height:1.7}'+
'#tq-app b{display:block;font-size:1.15rem;font-weight:800}#tq-app .r{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'+
'#tq-app button{font:inherit;font-weight:800;border:0;border-radius:14px;padding:10px 18px;cursor:pointer;background:#14804A;color:#fff;box-shadow:0 4px 0 #0C5A33}'+
'#tq-app button.g{background:#F1E9D6;color:#14204A;box-shadow:0 4px 0 #E0D3B4}'+
'#tq-rem{display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer}#tq-rem input{width:20px;height:20px}'+
'#tq-app ol{margin:10px 0 0;padding-inline-start:22px}#tq-app li{margin:4px 0}#tq-app .s{display:inline-block;background:#EEF4FF;border-radius:8px;padding:0 8px;font-weight:800}';
var OPEN=false;
function steps(){
 if(IOS&&!SAFARI)return '<ol><li>افتح هذه الصفحة في متصفح <span class="s">Safari</span> (اضغط «نسخ الرابط» ثم الصقه في Safari).</li><li>اضغط زر المشاركة <span class="s">⬆️</span> ثم <span class="s">إضافة إلى الشاشة الرئيسية</span>.</li></ol><div class="r"><button class="g" data-app="copy">📋 نسخ الرابط</button></div>';
 if(IOS)return '<ol><li>اضغط زر المشاركة <span class="s">⬆️</span> في شريط Safari.</li><li>مرّر القائمة واختر <span class="s">إضافة إلى الشاشة الرئيسية</span>.</li><li>اضغط <span class="s">إضافة</span>. ستظهر أيقونة «طلاقة» على شاشتك.</li></ol>';
 return '<ol><li>افتح قائمة المتصفح <span class="s">⋮</span>.</li><li>اختر <span class="s">تثبيت التطبيق</span> أو <span class="s">إضافة إلى الشاشة الرئيسية</span>.</li></ol>'}
function paint(){
 var root=document.getElementById('app');if(!root)return;var box=document.getElementById('tq-app');
 var sv=staffView(),portal=sv?(root.querySelector('#fTeach,#fOwn,.tabs,#tqfz-admin')||root.querySelector('h1')):root.querySelector('.tqi-wrap,.tools'),m=me(),later=Number(get('tq_app_later',0))||0;
 var show=!!(portal&&(m||sv)&&!standalone()&&!get('tq_app_done',0)&&Date.now()>later);
 if(!show){if(box)box.remove();return}
 if(!document.getElementById('tq-app-css')){var st=document.createElement('style');st.id='tq-app-css';st.textContent=CSS;document.head.appendChild(st)}
 var html='<b>📲 ثبّت «طلاقة» على جهازك</b>'+(sv?'تفتح الأيقونة على شاشة دخولك مباشرة.':'تدخل بعدها بضغطة واحدة من الأيقونة، دون مسح البطاقة ودون كتابة رقمك.')+
  (OPEN&&!deferred?steps():'')+
  '<div class="r">'+(deferred?'<button data-app="install">تثبيت</button>':(OPEN?'':'<button data-app="how">كيف أثبّته؟</button>'))+'<button class="g" data-app="later">لاحقًا</button></div>';
 if(!box){box=document.createElement('div');box.id='tq-app';box.setAttribute('role','region');box.setAttribute('aria-label','تثبيت التطبيق');
  box.addEventListener('click',function(e){var b=e.target.closest('button[data-app]');if(!b)return;e.preventDefault();e.stopPropagation();var k=b.getAttribute('data-app');
   if(k==='later'){put('tq_app_later',Date.now()+7*864e5);paint()}
   else if(k==='how'){OPEN=true;paint()}
   else if(k==='copy'){var u=location.origin+location.pathname+'?id='+encodeURIComponent((me()||{}).p||'');try{navigator.clipboard.writeText(u);b.textContent='✅ نُسخ الرابط'}catch(er){prompt('انسخ الرابط:',u)}}
   else if(k==='install'&&deferred){var d=deferred;deferred=null;try{d.prompt();if(d.userChoice)d.userChoice.then(function(c){if(c&&c.outcome==='accepted')put('tq_app_done',1);paint()})}catch(er){paint()}}})}
 if(box.__h!==html){box.innerHTML=html;box.__h=html}
 var anchor=(!sv&&root.querySelector('.tqfz-note'))||portal;if(anchor.tagName==='H1'){if(box.previousSibling!==anchor)anchor.parentNode.insertBefore(box,anchor.nextSibling)}else if(box.nextSibling!==anchor)anchor.parentNode.insertBefore(box,anchor)}
function tick(){try{staff()}catch(e){}try{syncUrl();paint()}catch(e){}}
function start(){tick();var t=null;try{new MutationObserver(function(){if(t)return;t=setTimeout(function(){t=null;tick()},80)}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true})}catch(e){}
 window.addEventListener('storage',tick);setInterval(syncUrl,2000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
