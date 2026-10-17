/* طلاقة · الإرسال التلقائي للتقدّم (sync.js)
   يرسل خطوات الطالب المنجزة وزيارته اليومية إلى خادم المدرسة (Google Apps Script)
   دون أي رمز يرسله الطالب. يعمل فقط إذا وُضع رابط الخادم في send-config.json («progress»).
   إن انقطع الإنترنت تبقى الخطوات في الجهاز وتُرسل لاحقًا. */
(function(){
'use strict';
if(window.__tqSync)return;window.__tqSync=true;
function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function ymd(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function fnv(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16)}
function rcNorm(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
var PAGE=/grade-([a-z0-9]+)\.html/i.exec(location.pathname),GRADE=PAGE?PAGE[1].toUpperCase():null;
var URL_=null,busy=false;

/* التقط رمزي الدخول عند الدخول من صفحة الصف أو البوابة */
document.addEventListener('submit',function(e){var f=e.target;if(!f||!f.id)return;
 var c=null,p=null;if(f.id==='shSec'){c=(document.getElementById('shRc')||{}).value;p=(document.getElementById('shPc')||{}).value}
 else if(f.id==='fSec'){c=(document.getElementById('secIn')||{}).value;p=(document.getElementById('pinIn')||{}).value}
 if(c&&p)put('tq_auth',{c:rcNorm(c),p:String(p).replace(/[^0-9]/g,'')})},true);

function who(){
 var me=null;if(GRADE){var g=get('gs_me_'+GRADE,null);if(g&&g.name&&g.sec!=='معاينة')me={name:g.name,sec:g.sec}}
 var pt=get('pt_me',null);if(pt&&pt.pv)return null;
 if(!me&&pt&&pt.name)me={name:pt.name,sec:pt.sec};
 if(!me||window.__pv)return null;
 var a=(pt&&pt.c&&pt.p&&pt.name===me.name&&pt.sec===me.sec)?{c:pt.c,p:pt.p}:get('tq_auth',null);
 if(!a||!a.c||!a.p)return null;me.c=rcNorm(a.c);me.p=String(a.p);return me}

/* كل خطوة منجزة لها مفتاح ثابت: r|وحدة|درجة (القراءة) أو s|مهمة (التحدث) */
function items(me){var out=[],H=(get('hr_students',{})||{})[me.name],P=(get('sp_students',{})||{})[me.name];
 if(H&&H.p)Object.keys(H.p).forEach(function(u){var x=H.p[u];if(!x||typeof x!=='object')return;Object.keys(x).forEach(function(i){var s=x[i];if(s&&s.done)out.push({t:'r',k:u+'|'+i,v:s.by==='n'?0:1})})});
 if(P&&P.p)Object.keys(P.p).forEach(function(id){var s=P.p[id];if(s&&s.done){var r=s.sr||{};out.push({t:'s',k:id,v:(r.f||0)+(r.k||0)+(r.w||0)})}});
 var G=get('tg_gm',null);if(G&&G.who===me.sec+'|'+me.name&&G.p>0)out.push({t:'g',k:String(G.w||''),v:G.p});
 return out}

function cfg(){if(URL_!==null)return Promise.resolve(URL_);return fetch('send-config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){URL_=String(c.progress||'');return URL_}).catch(function(){URL_='';return ''})}

function flush(){
 if(busy)return;var me=who();if(!me)return;
 cfg().then(function(url){if(!url)return;
  var key=me.sec+'|'+me.name,S=get('tq_sent',{})||{},sent=S[key]||{},today=ymd(),ev=[];
  if(sent['v|'+today]==null)ev.push({t:'v',k:today,v:1,d:today});
  items(me).forEach(function(x){var id=x.t+'|'+x.k;if(sent[id]==null||(x.t!=='r'&&x.v>sent[id]))ev.push({t:x.t,k:x.k,v:x.v,d:today})});
  if(!ev.length)return;busy=true;
  fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({sec:me.sec,name:me.name,pf:fnv('ap|'+me.sec+'|'+me.name+'|'+me.c+'|'+me.p),g:GRADE||'',ev:ev}),keepalive:true})
   .then(function(r){return r.json()}).then(function(j){if(j&&j.ok){S=get('tq_sent',{})||{};var s2=S[key]||{};ev.forEach(function(x){s2[x.t==='v'?'v|'+x.k:x.t+'|'+x.k]=x.v});S[key]=s2;put('tq_sent',S)}else if(j&&j.err==='auth'){try{localStorage.removeItem('tq_auth')}catch(e){}}})
   .catch(function(){}).then(function(){busy=false})})}

function boot(){setTimeout(flush,1500);setInterval(flush,30000);
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush()});
 window.addEventListener('online',flush)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.__tqFlush=flush;
})();
