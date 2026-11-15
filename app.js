/* طلاقة · التثبيت كتطبيق والدخول الدائم (app.js)
   - بعد أن يدخل الطالب (ببطاقة QR أو برقمه) تظهر له دعوة «ثبّت طلاقة على جهازك» بالخطوات المناسبة لجهازه.
   - أندرويد والحاسوب: زر «تثبيت» مباشر (manifest.json). دخول الطالب محفوظ في الجهاز فيبقى داخلًا.
   - آيفون وآيباد: التطبيق المثبَّت له ذاكرة منفصلة عن Safari، لذلك نُبقي رقم الطالب في عنوان الصفحة (‎?id=‎)
     ليُحفظ مع الأيقونة عند «إضافة إلى الشاشة الرئيسية»، فيدخل الطالب من الأيقونة مباشرة في كل مرة.
     الأيقونة إذن تساوي بطاقة QR: من يحمل الجهاز يدخل باسم الطالب.
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

/* آبل: عنوان الصفحة يحمل رقم الطالب ما دام داخلًا، ويُزال عند خروجه */
function syncUrl(){if(!IOS||standalone())return;
 try{var m=me(),want=location.pathname+(m?'?id='+encodeURIComponent(m.p):'');
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
'#tq-app ol{margin:10px 0 0;padding-inline-start:22px}#tq-app li{margin:4px 0}#tq-app .s{display:inline-block;background:#EEF4FF;border-radius:8px;padding:0 8px;font-weight:800}';
var OPEN=false;
function steps(){
 if(IOS&&!SAFARI)return '<ol><li>افتح هذه الصفحة في متصفح <span class="s">Safari</span> (اضغط «نسخ الرابط» ثم الصقه في Safari).</li><li>اضغط زر المشاركة <span class="s">⬆️</span> ثم <span class="s">إضافة إلى الشاشة الرئيسية</span>.</li></ol><div class="r"><button class="g" data-app="copy">📋 نسخ الرابط</button></div>';
 if(IOS)return '<ol><li>اضغط زر المشاركة <span class="s">⬆️</span> في شريط Safari.</li><li>مرّر القائمة واختر <span class="s">إضافة إلى الشاشة الرئيسية</span>.</li><li>اضغط <span class="s">إضافة</span>. ستظهر أيقونة «طلاقة» على شاشتك.</li></ol>';
 return '<ol><li>افتح قائمة المتصفح <span class="s">⋮</span>.</li><li>اختر <span class="s">تثبيت التطبيق</span> أو <span class="s">إضافة إلى الشاشة الرئيسية</span>.</li></ol>'}
function paint(){
 var root=document.getElementById('app');if(!root)return;var box=document.getElementById('tq-app');
 var portal=root.querySelector('.tqi-wrap,.tools'),m=me(),later=Number(get('tq_app_later',0))||0;
 var show=!!(portal&&m&&!standalone()&&!get('tq_app_done',0)&&Date.now()>later);
 if(!show){if(box)box.remove();return}
 if(!document.getElementById('tq-app-css')){var st=document.createElement('style');st.id='tq-app-css';st.textContent=CSS;document.head.appendChild(st)}
 var html='<b>📲 ثبّت «طلاقة» على جهازك</b>تدخل بعدها بضغطة واحدة من الأيقونة، دون مسح البطاقة ودون كتابة رقمك.'+
  (OPEN&&!deferred?steps():'')+
  '<div class="r">'+(deferred?'<button data-app="install">تثبيت</button>':(OPEN?'':'<button data-app="how">كيف أثبّته؟</button>'))+'<button class="g" data-app="later">لاحقًا</button></div>';
 if(!box){box=document.createElement('div');box.id='tq-app';box.setAttribute('role','region');box.setAttribute('aria-label','تثبيت التطبيق');
  box.addEventListener('click',function(e){var b=e.target.closest('button[data-app]');if(!b)return;e.preventDefault();e.stopPropagation();var k=b.getAttribute('data-app');
   if(k==='later'){put('tq_app_later',Date.now()+7*864e5);paint()}
   else if(k==='how'){OPEN=true;paint()}
   else if(k==='copy'){var u=location.origin+location.pathname+'?id='+encodeURIComponent((me()||{}).p||'');try{navigator.clipboard.writeText(u);b.textContent='✅ نُسخ الرابط'}catch(er){prompt('انسخ الرابط:',u)}}
   else if(k==='install'&&deferred){var d=deferred;deferred=null;try{d.prompt();if(d.userChoice)d.userChoice.then(function(c){if(c&&c.outcome==='accepted')put('tq_app_done',1);paint()})}catch(er){paint()}}})}
 if(box.__h!==html){box.innerHTML=html;box.__h=html}
 var anchor=root.querySelector('.tqfz-note')||portal;if(box.nextSibling!==anchor)anchor.parentNode.insertBefore(box,anchor)}
function tick(){try{syncUrl();paint()}catch(e){}}
function start(){tick();var t=null;try{new MutationObserver(function(){if(t)return;t=setTimeout(function(){t=null;tick()},80)}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true})}catch(e){}
 window.addEventListener('storage',tick);setInterval(syncUrl,2000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
