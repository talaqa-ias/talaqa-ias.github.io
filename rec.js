/* طلاقة · التسجيلات الصوتية (rec.js)
   - القراءة: يضيف زر «🎙️ سجّل قراءتك» في كل بند من بنود القراءة.
   - التحدث: يستخدم تسجيلات الأداة نفسها.
   - زر «📤 أرسل تسجيلات هذه المهمة» يرفع تسجيلات المهمة الحالية إلى Drive المدرسة
     (مجلد الشعبة ← مجلد الطالب)، ويُعرف الطالب في الخادم من رموزه لا من اسم يرسله الجهاز. */
(function(){
'use strict';
if(window.__tqRec)return;window.__tqRec=true;
var PAGE=/grade-([a-z0-9]+)\.html/i.exec(location.pathname),GRADE=PAGE?PAGE[1].toUpperCase():null;if(!GRADE)return;
function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fnv(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16)}
function rcNorm(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function toast(m){var t=document.createElement('div');t.className='toast';t.textContent=m;t.setAttribute('role','status');document.body.appendChild(t);setTimeout(function(){t.remove()},3200)}

/* ---------- من الطالب؟ ---------- */
function who(){var g=get('gs_me_'+GRADE,null);if(!g||!g.name||g.sec==='معاينة'||window.__pv)return null;
 var pt=get('pt_me',null),a=(pt&&pt.c&&pt.p&&pt.name===g.name&&pt.sec===g.sec)?{c:pt.c,p:pt.p}:get('tq_auth',null);
 return {name:g.name,sec:g.sec,c:a&&a.c?rcNorm(a.c):'',p:a&&a.p?String(a.p):''}}

/* ---------- التخزين في الجهاز (نفس قاعدة أداة التحدث) ---------- */
var DB=new Promise(function(res,rej){try{var r=indexedDB.open('tq_rec',1);r.onupgradeneeded=function(){r.result.createObjectStore('r')};r.onsuccess=function(){res(r.result)};r.onerror=rej}catch(e){rej(e)}});
function rput(k,v){return DB.then(function(db){return new Promise(function(r){var t=db.transaction('r','readwrite');t.objectStore('r').put(v,k);t.oncomplete=r;t.onerror=r})})}
function rget(k){return DB.then(function(db){return new Promise(function(r){var q=db.transaction('r').objectStore('r').get(k);q.onsuccess=function(){r(q.result)};q.onerror=function(){r(null)}})})}
function rkeys(){return DB.then(function(db){return new Promise(function(r){var q=db.transaction('r').objectStore('r').getAllKeys();q.onsuccess=function(){r(q.result||[])};q.onerror=function(){r([])}})})}

/* ---------- المهمة الحالية ---------- */
function vis(id){var A=document.getElementById(id);return A&&!A.hidden?A:null}
function txt(e){return e?e.textContent.replace(/\s+/g,' ').trim():''}
var lastSpk=null;
function current(){
 var me=who();if(!me)return null;
 var R=vis('app-read');
 if(R){var cr=R.querySelector('.crumb'),nav=R.querySelector('.nav [data-a="next"]');if(!cr||!nav)return null;
  var where='';try{where=window.__readWhere?window.__readWhere():''}catch(e){}
  var parts=where.split(' ← '),item=(parts[2]||'').replace('البند','').trim()||'1',title=parts.slice(0,2).join(' · ')||txt(cr);
  return {tool:'read',me:me,title:title,part:'البند '+item,key:'read:'+me.name+':'+fnv(title)+':'+item,prefix:'read:'+me.name+':'+fnv(title)+':',host:cr}}
 var S=vis('app-speak');
 if(S){var rb=S.querySelector('[data-a="rec"][data-k]'),cr2=S.querySelector('.crumb');if(!cr2){lastSpk=null;return null}
  var cps=txt(cr2).split('←'),tt=cps.pop().trim(),lvl=(cps[0]||'').trim(),phs=[].map.call(S.querySelectorAll('.phases li b'),txt);
  if(rb){var k=rb.dataset.k,pre=k.slice(0,k.lastIndexOf(':')+1);lastSpk={pre:pre,title:tt}}
  if(!lastSpk||lastSpk.title!==tt)return null;
  return {tool:'speak',me:me,title:(lvl?lvl+' · ':'')+tt,prefix:lastSpk.pre,host:S.querySelector('.phases')||cr2,spk:true,phs:phs}}
 return null}

/* ---------- تسجيل القراءة ---------- */
var REC=null,STREAM=null,CH=[],PL=new Audio();
function mime(){var m=['audio/webm;codecs=opus','audio/mp4','audio/webm'];for(var i=0;i<m.length;i++)if(window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m[i]))return m[i];return ''}
function toggle(cur,btn){
 if(REC&&REC.state==='recording'){REC.stop();return}
 var go=function(){CH=[];var mt=mime();try{REC=new MediaRecorder(STREAM,mt?{mimeType:mt}:undefined)}catch(e){toast('التسجيل غير مدعوم في هذا المتصفح');return}
  REC.ondataavailable=function(e){if(e.data&&e.data.size)CH.push(e.data)};
  REC.onstop=function(){var b=new Blob(CH,{type:REC.mimeType||mt});rput(cur.key,{blob:b,mime:b.type,at:new Date().toISOString(),title:cur.title,part:cur.part}).then(function(){toast('حُفظ تسجيلك ✓');paint(true)})};
  REC.start();btn.classList.add('on');btn.textContent='⏹ أوقف التسجيل'};
 if(STREAM)return go();
 navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}).then(function(s){STREAM=s;go()}).catch(function(){toast('اسمح باستخدام الميكروفون')})}

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
 cfg().then(function(url){if(!url){toast('الإرسال غير مفعّل بعد. أخبر معلمك.');return}
  list(cur).then(function(items){var todo=unsent(items);if(!items.length){toast('لا توجد تسجيلات في هذه المهمة بعد');return}if(!todo.length){toast('أُرسلت كل تسجيلات هذه المهمة من قبل ✓');return}
   sending=true;var done=0,fail=0,box=document.querySelector('.tqr-send');
   var step=function(i){if(i>=todo.length){sending=false;paint(true);toast(fail?('أُرسل '+done+' وتعذّر '+fail+'. حاول مرة أخرى.'):('وصلت تسجيلاتك إلى معلمك ✓ ('+done+')'));return}
    var x=todo[i];if(box)box.textContent='⏳ يُرسل '+(i+1)+' من '+todo.length+'…';
    b64(x.v.blob).then(function(data){var pi=String(x.k).split(':').pop()*1,part=x.v.part||((cur.phs&&cur.phs[pi])||('المرحلة '+(pi+1)));
     return fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({a:'rec',sec:me.sec,sid:fnv('sid|'+me.sec+'|'+me.name+'|'+me.c),pf:fnv('ap|'+me.sec+'|'+me.name+'|'+me.c+'|'+me.p),g:GRADE,tool:cur.tool,title:x.v.title||cur.title,part:part,mime:x.v.mime||x.v.blob.type,b64:data})}).then(function(r){return r.json()})})
     .then(function(j){if(j&&j.ok){var S=sentMap();S[x.k]=x.v.at;put('tq_recsent',S);done++}else fail++}).catch(function(){fail++}).then(function(){step(i+1)})};
   step(0)})})}

/* ---------- الواجهة ---------- */
var busy=false,lastSig='';
function paint(force){if(busy)return;if(REC&&REC.state==='recording'&&!force)return;busy=true;
 try{var cur=current(),old=document.querySelector('.tqr');
  if(!cur){if(old)old.remove();busy=false;return}
  var sig=cur.tool+'|'+(cur.key||cur.prefix)+'|'+(REC&&REC.state);
  if(old&&!force&&sig===lastSig&&old.isConnected){busy=false;return}
  lastSig=sig;
  list(cur).then(function(items){
   var n=items.length,u=unsent(items).length,has=cur.key&&items.some(function(x){return x.k===cur.key});
   var h='<div class="tqr-in">'+(cur.spk?'':'<button type="button" class="tqr-b rec" data-r="rec">🎙️ '+(has?'أعد تسجيل قراءتك':'سجّل قراءتك')+'</button>'+(has?'<button type="button" class="tqr-b" data-r="play">▶ اسمع</button>':''))+
    '<button type="button" class="tqr-b send tqr-send" data-r="send"'+(n?'':' disabled')+'>📤 أرسل تسجيلات هذه المهمة'+(n?' ('+n+(u&&u<n?' · جديد '+u:'')+')':'')+'</button>'+
    (n&&!u?'<span class="tqr-ok">✓ وصلت</span>':'')+'</div>';
   var w=document.querySelector('.tqr')||document.createElement('div');w.className='tqr';w.innerHTML=h;
   if(!w.isConnected||w.previousElementSibling!==cur.host){cur.host.parentNode.insertBefore(w,cur.host.nextSibling)}
   w.onclick=function(e){var b=e.target.closest('[data-r]');if(!b)return;var c=current();if(!c)return;
    if(b.dataset.r==='rec')toggle(c,b);
    if(b.dataset.r==='play')rget(c.key).then(function(v){if(v){PL.src=URL.createObjectURL(v.blob);PL.play()}});
    if(b.dataset.r==='send')send(c)};
   busy=false}).catch(function(){busy=false})
 }catch(e){busy=false}}

var css=document.createElement('style');css.textContent=
'.tqr{margin:10px 0 14px}.tqr-in{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;background:#fff;border:3px dashed #FF9417;border-radius:20px;padding:10px}'+
'.tqr-b{border:0;border-radius:16px;padding:10px 16px;font:inherit;font-weight:800;font-size:1.05rem;background:#F6FAFF;box-shadow:0 4px 0 #D3E4F5;cursor:pointer;min-height:48px}'+
'.tqr-b.rec{background:#FF6B6B;color:#fff;box-shadow:0 4px 0 #C94545}.tqr-b.rec.on{background:#1D2B4F;box-shadow:0 4px 0 #0d1530;animation:tqrP 1s infinite}'+
'.tqr-b.send{background:#22B866;color:#fff;box-shadow:0 4px 0 #168A4B}.tqr-b[disabled]{opacity:.45;cursor:not-allowed}.tqr-ok{color:#13804A;font-weight:800}'+
'@keyframes tqrP{50%{opacity:.75}}#app-speak [data-a="sendrec"]{display:none!important}';
document.head.appendChild(css);
function boot(){paint();new MutationObserver(function(){if(!busy){clearTimeout(window.__tqrT);window.__tqrT=setTimeout(paint,80)}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
