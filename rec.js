/* طلاقة · التسجيلات الصوتية (rec.js)
   - مسجّل واحد للقراءة والتحدث: 🎙️ سجّل · ⏸ توقّف قليلًا · ▶ أكمل · ✅ أنهيت.
   - حفظ تلقائي إذا انتقل الطالب أو خرج من الصفحة أو نسي التسجيل مفتوحًا (حد أقصى 5 دقائق).
   - العودة إلى بند فيه تسجيل: «➕ أكمل تسجيلي» (جزء جديد) أو «🔁 سجّل من جديد» (بعد تأكيد).
   - «📤 أرسل تسجيلات هذه المهمة» يرفع الأجزاء إلى Drive المدرسة (الشعبة ← الطالب). */
(function(){
'use strict';
if(window.__tqRec)return;window.__tqRec=true;
var PAGE=/grade-([a-z0-9]+)\.html/i.exec(location.pathname),GRADE=PAGE?PAGE[1].toUpperCase():null;if(!GRADE)return;
var MAXMS=5*60*1000,MINMS=1000;
function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fnv(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16)}
function rcNorm(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function toast(m){var t=document.createElement('div');t.className='toast';t.textContent=m;t.setAttribute('role','status');document.body.appendChild(t);setTimeout(function(){t.remove()},3200)}
function mmss(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}

/* ---------- من الطالب؟ ---------- */
function who(){var g=get('gs_me_'+GRADE,null);if(!g||!g.name||g.sec==='معاينة'||window.__pv)return null;
 var pt=get('pt_me',null),a=(pt&&pt.c&&pt.p&&pt.name===g.name&&pt.sec===g.sec)?{c:pt.c,p:pt.p}:get('tq_auth',null);
 return {name:g.name,sec:g.sec,c:a&&a.c?rcNorm(a.c):'',p:a&&a.p?String(a.p):''}}

/* ---------- التخزين في الجهاز ---------- */
var DB=new Promise(function(res,rej){try{var r=indexedDB.open('tq_rec',1);r.onupgradeneeded=function(){r.result.createObjectStore('r')};r.onsuccess=function(){res(r.result)};r.onerror=rej}catch(e){rej(e)}});
function rput(k,v){return DB.then(function(db){return new Promise(function(r){var t=db.transaction('r','readwrite');t.objectStore('r').put(v,k);t.oncomplete=r;t.onerror=r})})}
function rget(k){return DB.then(function(db){return new Promise(function(r){var q=db.transaction('r').objectStore('r').get(k);q.onsuccess=function(){r(q.result)};q.onerror=function(){r(null)}})})}
function rdel(k){return DB.then(function(db){return new Promise(function(r){var t=db.transaction('r','readwrite');t.objectStore('r').delete(k);t.oncomplete=r;t.onerror=r})})}
function rkeys(){return DB.then(function(db){return new Promise(function(r){var q=db.transaction('r').objectStore('r').getAllKeys();q.onsuccess=function(){r(q.result||[])};q.onerror=function(){r([])}})})}
/* أجزاء البند: المفتاح الأساسي = الجزء 1، ثم مفتاح#2، مفتاح#3 … */
function baseOf(k){return String(k).split('#')[0]}
function partNo(k){var m=/#(\d+)$/.exec(String(k));return m?+m[1]:1}
function partsOf(base){return rkeys().then(function(ks){return ks.filter(function(k){return baseOf(k)===base}).sort(function(a,b){return partNo(a)-partNo(b)})})}

/* ---------- المهمة والبند الحاليان ---------- */
function vis(id){var A=document.getElementById(id);return A&&!A.hidden?A:null}
function txt(e){return e?e.textContent.replace(/\s+/g,' ').trim():''}
var lastSpk=null;
function current(){
 var me=who();if(!me)return null;
 var R=vis('app-read');
 if(R){var cr=R.querySelector('.crumb'),nav=R.querySelector('.nav [data-a="next"]');if(!cr||!nav)return null;
  var where='';try{where=window.__readWhere?window.__readWhere():''}catch(e){}
  var parts=where.split(' ← '),item=(parts[2]||'').replace('البند','').trim()||'1',title=parts.slice(0,2).join(' · ')||txt(cr);
  var pre='read:'+me.name+':'+fnv(title)+':';
  return {tool:'read',me:me,title:title,label:'البند '+item,key:pre+item,prefix:pre,host:cr}}
 var S=vis('app-speak');
 if(S){var box=S.querySelector('#recbox'),rb=box&&box.querySelector('[data-a="rec"][data-k]'),cr2=S.querySelector('.crumb');if(!cr2){lastSpk=null;return null}
  var cps=txt(cr2).split('←'),tt=cps.pop().trim(),lvl=(cps[0]||'').trim(),phs=[].map.call(S.querySelectorAll('.phases li b'),txt);
  var k=rb?rb.dataset.k:null;if(k){lastSpk={pre:k.slice(0,k.lastIndexOf(':')+1),title:tt}}
  if(!lastSpk||lastSpk.title!==tt)return null;
  var pi=k?+k.split(':').pop():-1;
  return {tool:'speak',me:me,title:(lvl?lvl+' · ':'')+tt,label:k?(phs[pi]||('المرحلة '+(pi+1))):'',key:k,prefix:lastSpk.pre,host:box||S.querySelector('.phases')||cr2,phs:phs,spk:true}}
 return null}

/* ---------- المسجّل ---------- */
var STREAM=null,PL=new Audio(),R=null; /* R: {key,meta,mr,chunks,state,acc,t0,tick,manualParts} */
var CAN_PAUSE=!!(window.MediaRecorder&&MediaRecorder.prototype&&MediaRecorder.prototype.pause);
function mime(){var m=['audio/webm;codecs=opus','audio/mp4','audio/webm'];for(var i=0;i<m.length;i++)if(window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m[i]))return m[i];return ''}
function elapsed(){return R?R.acc+(R.state==='rec'?Date.now()-R.t0:0):0}
function nextKey(base){return partsOf(base).then(function(ks){if(!ks.length)return base;return base+'#'+(partNo(ks[ks.length-1])+1)})}
function mic(){return STREAM&&STREAM.active?Promise.resolve(STREAM):navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}).then(function(s){STREAM=s;return s})}
function start(cur,mode){
 if(R)return;
 var go=function(key){return mic().then(function(s){var mt=mime(),mr;try{mr=new MediaRecorder(s,mt?{mimeType:mt}:undefined)}catch(e){toast('التسجيل غير مدعوم في هذا المتصفح');return}
  R={key:key,meta:{title:cur.title,part:cur.label,tool:cur.tool},mr:mr,chunks:[],state:'rec',acc:0,t0:Date.now(),mt:mt};
  mr.ondataavailable=function(e){if(e.data&&e.data.size&&R&&R.mr===mr)R.chunks.push(e.data)};
  mr.start(1000);R.tick=setInterval(tick,500);paint(true)}).catch(function(){toast('اسمح باستخدام الميكروفون')})};
 if(mode==='new')return partsOf(cur.key).then(function(ks){return Promise.all(ks.map(rdel)).then(function(){var S=get('tq_recsent',{})||{};ks.forEach(function(k){delete S[k]});put('tq_recsent',S);return go(cur.key)})});
 return nextKey(cur.key).then(go)}
function tick(){if(!R)return;var e=document.getElementById('tqr-t');if(e)e.textContent=mmss(elapsed());if(elapsed()>=MAXMS){finish('تجاوز التسجيل 5 دقائق، فحُفظ تلقائيًا ✓')}}
function pause(){if(!R||R.state!=='rec')return;
 if(CAN_PAUSE){try{R.mr.pause();R.acc+=Date.now()-R.t0;R.state='paused';paint(true);return}catch(e){}}
 /* متصفح قديم: نحفظ هذا الجزء، و«أكمل» يبدأ جزءًا جديدًا */
 finish('حُفظ ما سجّلته ✓ اضغط «➕ أكمل تسجيلي» لتكمل.')}
function resume(){if(!R||R.state!=='paused')return;try{R.mr.resume();R.t0=Date.now();R.state='rec';paint(true)}catch(e){finish()}}
function finish(msg){
 if(!R)return Promise.resolve();var r=R;R=null;clearInterval(r.tick);
 var dur=r.acc+(r.state==='rec'?Date.now()-r.t0:0);
 return new Promise(function(res){
  r.mr.onstop=function(){
   if(dur<MINMS){toast('التسجيل قصير جدًا، لم يُحفظ.');paint(true);res();return}
   var b=new Blob(r.chunks,{type:r.mr.mimeType||r.mt||'audio/webm'});
   rput(r.key,{blob:b,mime:b.type,at:new Date().toISOString(),title:r.meta.title,part:r.meta.part,tool:r.meta.tool,ms:dur}).then(function(){toast(msg||'حُفظ تسجيلك ✓');paint(true);res()})};
  try{if(r.mr.state!=='inactive')r.mr.stop();else r.mr.onstop()}catch(e){r.mr.onstop()}})}
/* حفظ تلقائي عند مغادرة الصفحة أو إخفائها */
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&R)finish('حُفظ تسجيلك تلقائيًا ✓')});
window.addEventListener('pagehide',function(){if(R)finish()});
function playAll(base){partsOf(base).then(function(ks){var i=0;var next=function(){if(i>=ks.length)return;rget(ks[i++]).then(function(v){if(!v)return next();PL.onended=next;PL.src=URL.createObjectURL(v.blob);PL.play().catch(function(){})})};try{PL.pause()}catch(e){}next()})}

/* ---------- الإرسال ---------- */
var URL_=null;
function cfg(){if(URL_!==null)return Promise.resolve(URL_);return fetch('send-config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){URL_=String(c.progress||'');return URL_}).catch(function(){URL_='';return ''})}
function b64(blob){return new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(String(fr.result).split(',')[1]||'')};fr.readAsDataURL(blob)})}
function list(cur){return rkeys().then(function(ks){ks=ks.filter(function(k){return String(k).indexOf(cur.prefix)===0}).sort();return Promise.all(ks.map(function(k){return rget(k).then(function(v){return v?{k:k,v:v}:null})}))}).then(function(a){return a.filter(Boolean)})}
function sentMap(){return get('tq_recsent',{})||{}}
function unsent(items){var S=sentMap();return items.filter(function(x){return S[x.k]!==x.v.at})}
var sending=false;
function send(cur){
 if(sending)return;var me=cur.me;
 if(!me.c||!me.p){toast('ادخل من بوابة طلاقة برمز شعبتك ورمزك الشخصي أولًا، ثم أعد الإرسال.');return}
 var pre=R?finish():Promise.resolve();
 pre.then(cfg).then(function(url){if(!url){toast('الإرسال غير مفعّل بعد. أخبر معلمك.');return}
  list(cur).then(function(items){var todo=unsent(items);if(!items.length){toast('لا توجد تسجيلات في هذه المهمة بعد');return}if(!todo.length){toast('أُرسلت كل تسجيلات هذه المهمة من قبل ✓');return}
   var multi={};items.forEach(function(x){var b=baseOf(x.k);multi[b]=(multi[b]||0)+1});
   sending=true;var done=0,fail=0,box=document.querySelector('.tqr-send');
   var step=function(i){if(i>=todo.length){sending=false;paint(true);toast(fail?('أُرسل '+done+' وتعذّر '+fail+'. حاول مرة أخرى.'):('وصلت تسجيلاتك إلى معلمك ✓ ('+done+')'));return}
    var x=todo[i];if(box)box.textContent='⏳ يُرسل '+(i+1)+' من '+todo.length+'…';
    b64(x.v.blob).then(function(data){var base=baseOf(x.k),pi=+base.split(':').pop(),lbl=x.v.part||((cur.phs&&cur.phs[pi])||('المرحلة '+(pi+1)));if(multi[base]>1)lbl+=' · الجزء '+partNo(x.k);
     return fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({a:'rec',sec:me.sec,sid:fnv('sid|'+me.sec+'|'+me.name+'|'+me.c),pf:fnv('ap|'+me.sec+'|'+me.name+'|'+me.c+'|'+me.p),g:GRADE,tool:cur.tool,title:x.v.title||cur.title,part:lbl,mime:x.v.mime||x.v.blob.type,b64:data})}).then(function(r){return r.json()})})
     .then(function(j){if(j&&j.ok){var S=sentMap();S[x.k]=x.v.at;put('tq_recsent',S);done++}else fail++}).catch(function(){fail++}).then(function(){step(i+1)})};
   step(0)})})}

/* ---------- الواجهة ---------- */
var busy=false,lastSig='',confirmNew=false;
function controls(cur,nParts){
 if(!cur.key)return '';
 if(R&&baseOf(R.key)===cur.key){
  return '<span class="tqr-live'+(R.state==='rec'?' on':'')+'"><i></i><b id="tqr-t">'+mmss(elapsed())+'</b> '+(R.state==='rec'?'يسجّل…':'متوقّف')+'</span>'+
   (R.state==='rec'?'<button type="button" class="tqr-b" data-r="pause">⏸ توقّف قليلًا</button>':'<button type="button" class="tqr-b go" data-r="resume">▶ أكمل</button>')+
   '<button type="button" class="tqr-b done" data-r="finish">✅ أنهيت</button>'}
 if(confirmNew)return '<span class="tqr-q">سيُحذف تسجيلك السابق. هل أنت متأكد؟</span><button type="button" class="tqr-b rec" data-r="new-yes">نعم، سجّل من جديد</button><button type="button" class="tqr-b" data-r="new-no">إلغاء</button>';
 if(!nParts)return '<button type="button" class="tqr-b rec" data-r="start">🎙️ '+(cur.tool==='read'?'سجّل قراءتك':'سجّل صوتك')+'</button>';
 return '<span class="tqr-ok">✓ محفوظ'+(nParts>1?' ('+nParts+' أجزاء)':'')+'</span><button type="button" class="tqr-b" data-r="play">▶ اسمع</button><button type="button" class="tqr-b go" data-r="more">➕ أكمل تسجيلي</button><button type="button" class="tqr-b" data-r="redo">🔁 سجّل من جديد</button>'}
function paint(force){if(busy)return;if(R&&!force){var c0=current();if(!c0||!c0.key||baseOf(R.key)!==c0.key)finish('حُفظ تسجيلك تلقائيًا ✓');return}busy=true;
 try{var cur=current(),old=document.querySelector('.tqr');
  /* انتقل الطالب إلى بند آخر أو خرج والتسجيل يعمل: احفظه تلقائيًا */
  if(R&&(!cur||!cur.key||baseOf(R.key)!==cur.key)){busy=false;finish('حُفظ تسجيلك تلقائيًا ✓');return}
  if(!cur){if(old)old.remove();busy=false;return}
  var sig=cur.tool+'|'+(cur.key||cur.prefix);
  if(old&&!force&&sig===lastSig&&old.isConnected){busy=false;return}
  if(sig!==lastSig)confirmNew=false;lastSig=sig;
  Promise.all([list(cur),cur.key?partsOf(cur.key):Promise.resolve([])]).then(function(a){
   var items=a[0],np=a[1].length,n=items.length,u=unsent(items).length;
   var h='<div class="tqr-in"><div class="tqr-rec">'+controls(cur,np)+'</div>'+
    '<button type="button" class="tqr-b send tqr-send" data-r="send"'+(n?'':' disabled')+'>📤 أرسل تسجيلات هذه المهمة'+(n?' ('+n+(u&&u<n?' · جديد '+u:'')+')':'')+'</button>'+
    (n&&!u?'<span class="tqr-ok">✓ وصلت</span>':'')+'</div>';
   var w=document.querySelector('.tqr')||document.createElement('div');w.className='tqr';w.innerHTML=h;
   if(!w.isConnected||w.previousElementSibling!==cur.host){cur.host.parentNode.insertBefore(w,cur.host.nextSibling)}
   w.onclick=function(e){var b=e.target.closest('[data-r]');if(!b)return;var c=current();if(!c)return;var r=b.dataset.r;
    if(r==='start'||r==='more')start(c,'add');
    if(r==='redo'){confirmNew=true;paint(true)}
    if(r==='new-no'){confirmNew=false;paint(true)}
    if(r==='new-yes'){confirmNew=false;start(c,'new')}
    if(r==='pause')pause();if(r==='resume')resume();if(r==='finish')finish();
    if(r==='play')playAll(c.key);
    if(r==='send')send(c)};
   busy=false}).catch(function(){busy=false})
 }catch(e){busy=false}}

var css=document.createElement('style');css.textContent=
'#app-speak #recbox{display:none!important}#app-speak [data-a="sendrec"]{display:none!important}'+
'.tqr{margin:10px 0 14px}.tqr-in{display:flex;flex-direction:column;gap:10px;align-items:center;background:#fff;border:3px dashed #FF9417;border-radius:20px;padding:12px}'+
'.tqr-rec{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center}'+
'.tqr-b{border:0;border-radius:16px;padding:10px 16px;font:inherit;font-weight:800;font-size:1.05rem;background:#F6FAFF;box-shadow:0 4px 0 #D3E4F5;cursor:pointer;min-height:50px;color:#1D2B4F}'+
'.tqr-b.rec{background:#FF6B6B;color:#fff;box-shadow:0 4px 0 #C94545}.tqr-b.go{background:#2F9BF0;color:#fff;box-shadow:0 4px 0 #1E6FD9}.tqr-b.done{background:#22B866;color:#fff;box-shadow:0 4px 0 #168A4B}'+
'.tqr-b.send{background:#8E5CF7;color:#fff;box-shadow:0 4px 0 #6236C9}.tqr-b[disabled]{opacity:.45;cursor:not-allowed}.tqr-ok{color:#13804A;font-weight:800}.tqr-q{font-weight:800;color:#B83838}'+
'.tqr-live{display:inline-flex;align-items:center;gap:8px;font-weight:800;background:#FFF0F0;border-radius:999px;padding:8px 14px;color:#B83838}.tqr-live i{width:14px;height:14px;border-radius:50%;background:#9AA7BD}.tqr-live.on i{background:#E53935;animation:tqrP 1s infinite}.tqr-live b{font-variant-numeric:tabular-nums;direction:ltr}'+
'@keyframes tqrP{50%{opacity:.25}}';
document.head.appendChild(css);
function boot(){paint();new MutationObserver(function(){if(!busy){clearTimeout(window.__tqrT);window.__tqrT=setTimeout(function(){paint()},80)}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
