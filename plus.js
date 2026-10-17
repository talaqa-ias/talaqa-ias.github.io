/* طلاقة · طبقة التحفيز (plus.js)
   تعمل فوق أدوات القراءة والتحدث دون تعديل محركاتها:
   - بطاقة «تابع» تقود الطالب إلى خطوته التالية مباشرة.
   - سلسلة أيام التدريب (الإثنين إلى الجمعة) وهدف أسبوعي.
   - رُتب «فصيح الصقر» حسب عدد الخطوات المنجزة.
   - احتفال قصير (صوت + قصاصات) عند كل خطوة جديدة.
   البيانات محلية في جهاز الطالب فقط (localStorage: tq_plus). */
(function(){
'use strict';
if(window.__tqPlus)return;window.__tqPlus=true;

/* ---------- أدوات صغيرة ---------- */
function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
var rawSet=Storage.prototype.setItem;
function put(k,v){try{rawSet.call(localStorage,k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ymd(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}

/* ---------- التميمة: فصيح الصقر (رسم أصلي) ---------- */
var MASCOT='<svg class="tq-falcon" viewBox="0 0 120 130" aria-hidden="true">'+
 '<ellipse cx="60" cy="124" rx="30" ry="5" fill="rgba(29,43,79,.12)"/>'+
 '<path d="M24 74 Q12 100 32 116 Q36 94 40 78Z" fill="#5C3A22"/><path d="M96 74 Q108 100 88 116 Q84 94 80 78Z" fill="#5C3A22"/>'+
 '<path d="M30 66 Q60 54 90 66 Q100 118 60 120 Q20 118 30 66Z" fill="#8B5A33"/>'+
 '<path d="M40 74 Q60 66 80 74 Q86 112 60 114 Q34 112 40 74Z" fill="#FBF3E6"/>'+
 '<g fill="#B98A5E"><circle cx="50" cy="86" r="2.2"/><circle cx="60" cy="82" r="2.2"/><circle cx="70" cy="86" r="2.2"/><circle cx="55" cy="96" r="2.2"/><circle cx="65" cy="96" r="2.2"/><circle cx="60" cy="106" r="2.2"/></g>'+
 '<path d="M48 119 v6 M54 119 v6 M66 119 v6 M72 119 v6" stroke="#F2A93B" stroke-width="4" stroke-linecap="round"/>'+
 '<ellipse cx="60" cy="44" rx="30" ry="29" fill="#FBF3E6"/>'+
 '<path d="M30 46 Q28 14 60 14 Q92 14 90 46 Q84 34 74 33 Q60 30 46 33 Q36 34 30 46Z" fill="#3E2A1C"/>'+
 '<path d="M36 40 Q34 56 42 64 Q46 54 45 44Z" fill="#3E2A1C"/><path d="M84 40 Q86 56 78 64 Q74 54 75 44Z" fill="#3E2A1C"/>'+
 '<circle cx="49" cy="44" r="9.5" fill="#FFD25A"/><circle cx="71" cy="44" r="9.5" fill="#FFD25A"/>'+
 '<circle cx="49" cy="44" r="7" fill="#1D2B4F"/><circle cx="71" cy="44" r="7" fill="#1D2B4F"/>'+
 '<circle cx="51.5" cy="41.5" r="2.4" fill="#fff"/><circle cx="73.5" cy="41.5" r="2.4" fill="#fff"/>'+
 '<path d="M53 52 Q60 47 67 52 Q67 60 61 66 Q60 61 57 59 Q53 57 53 52Z" fill="#FFC83D"/><path d="M61 66 Q63 61 66 57 Q65 63 61 66Z" fill="#3A2A1A"/>'+
 '<ellipse cx="40" cy="58" rx="4" ry="2.6" fill="#FF9AA8" opacity=".5"/><ellipse cx="80" cy="58" rx="4" ry="2.6" fill="#FF9AA8" opacity=".5"/>'+
 '</svg>';

/* ---------- الرتب ---------- */
var RANKS=[
 {n:0,  t:'بَيْضَةُ الصَّقْرِ', i:'🥚'},
 {n:5,  t:'فَرْخُ الصَّقْرِ',  i:'🐣'},
 {n:20, t:'صَقْرٌ صَغِيرٌ',   i:'🪶'},
 {n:50, t:'صَقْرٌ طَائِرٌ',   i:'🌤️'},
 {n:100,t:'صَقْرٌ ذَهَبِيٌّ',  i:'🏅'},
 {n:200,t:'صَقْرُ الطَّلَاقَةِ', i:'👑'}];
function rankOf(n){var r=RANKS[0],nx=null;for(var i=0;i<RANKS.length;i++){if(n>=RANKS[i].n)r=RANKS[i];else{nx=RANKS[i];break}}return {r:r,nx:nx}}

/* ---------- من الطالب؟ ---------- */
var PAGE=/grade-([a-z0-9]+)\.html/i.exec(location.pathname),GRADE=PAGE?PAGE[1].toUpperCase():null;
var IS_GAMES=/games\.html/.test(location.pathname);
function who(){
 if(GRADE){var g=get('gs_me_'+GRADE,null);if(g&&g.name&&g.sec!=='معاينة')return {name:g.name,sec:g.sec,av:g.av}}
 var p=get('pt_me',null);if(p&&p.name&&!p.pv)return {name:p.name,sec:p.sec,av:p.av};
 return null}
function preview(){return !!window.__pv||(get('pt_me',{})||{}).pv}

/* خطوة منجزة = أي عنصر فيه done في تقدّم القراءة أو التحدث لهذا الطالب */
function countDone(o){var n=0;if(!o||typeof o!=='object')return 0;if(o.done&&o.by!=='n')n++;for(var k in o)if(o.hasOwnProperty(k)&&o[k]&&typeof o[k]==='object')n+=countDone(o[k]);return n}
function steps(me){if(!me)return 0;var H=get('hr_students',{})||{},P=get('sp_students',{})||{};return countDone((H[me.name]||{}).p)+countDone((P[me.name]||{}).p)}

/* ---------- سجل التحفيز لكل طالب ---------- */
function key(me){return me.sec+'|'+me.name}
function rec(me){var A=get('tq_plus',{})||{};return A[key(me)]||{days:{},cnt:null,last:null,mute:false}}
function saveRec(me,r){var A=get('tq_plus',{})||{};A[key(me)]=r;put('tq_plus',A)}
function isSchoolDay(d){var w=d.getDay();return w>=1&&w<=5} /* الإثنين–الجمعة */
function streak(r){var d=new Date(),n=0,guard=0;if(!r.days[ymd(d)]){d.setDate(d.getDate()-1)}
 while(guard++<400){if(!isSchoolDay(d)){if(r.days[ymd(d)])n++;d.setDate(d.getDate()-1);continue}if(r.days[ymd(d)]){n++;d.setDate(d.getDate()-1)}else break}
 return n}
function weekDays(r){var d=new Date(),w=d.getDay(),mon=new Date(d);mon.setDate(d.getDate()-((w+6)%7));var out=[];for(var i=0;i<5;i++){var x=new Date(mon);x.setDate(mon.getDate()+i);out.push({k:ymd(x),on:!!r.days[ymd(x)],today:ymd(x)===ymd()})}return out}
var DN=['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];

/* ---------- صوت واحتفال ---------- */
var AC=null;
function chime(me){try{if(me&&rec(me).mute)return;AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t=AC.currentTime;[523.25,659.25,783.99,1046.5].forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t+i*.09);g.gain.exponentialRampToValueAtTime(0.18,t+i*.09+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+i*.09+.35);o.connect(g);g.connect(AC.destination);o.start(t+i*.09);o.stop(t+i*.09+.4)})}catch(e){}}
function burst(){if(matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;var box=el('div','tq-burst');var C=['#FFC83D','#22B866','#2F9BF0','#FF6B6B','#8E5CF7','#FF9417'];for(var i=0;i<36;i++){var s=el('i');s.style.left=(Math.random()*100)+'%';s.style.background=C[i%C.length];s.style.animationDelay=(Math.random()*.35)+'s';s.style.transform='rotate('+(Math.random()*360)+'deg)';box.appendChild(s)}document.body.appendChild(box);setTimeout(function(){box.remove()},2200)}
var CHEER=['خُطْوَةٌ جَدِيدَةٌ! ✅','عَمَلٌ رَائِعٌ! 👏','هٰكَذَا يَكُونُ الْأَبْطَالُ! 💪','أَحْسَنْتَ الْعَمَلَ! 👏','تَقَدُّمٌ جَمِيلٌ! 🚀'];
function celebrate(me,r,gained){
 burst();chime(me);
 var R=rankOf(r.cnt),prev=rankOf(r.cnt-gained),up=R.r!==prev.r,st=streak(r);
 var msg=up?'رُتْبَةٌ جَدِيدَةٌ: '+R.r.i+' '+R.r.t:CHEER[r.cnt%CHEER.length];
 var c=el('div','tq-cheer',MASCOT+'<div><b>'+msg+'</b><small>✅ '+r.cnt+' خطوة'+(st>1?' · 🔥 '+st+' أيام متتالية':'')+'</small></div>');
 c.setAttribute('role','status');document.body.appendChild(c);setTimeout(function(){c.classList.add('out')},2600);setTimeout(function(){c.remove()},3100);
}

/* ---------- مزامنة العدّاد ---------- */
function sync(silent){
 if(preview())return;var me=who();if(!me)return;var r=rec(me),n=steps(me);
 if(r.cnt==null){r.cnt=n;saveRec(me,r);return}
 if(n>r.cnt){var g=n-r.cnt;r.cnt=n;r.days[ymd()]=1;saveRec(me,r);if(!silent)celebrate(me,r,g);paint()}
 else if(n!==r.cnt){r.cnt=n;saveRec(me,r)}
}
Storage.prototype.setItem=function(k,v){rawSet.apply(this,arguments);if(k==='hr_students'||k==='sp_students'){clearTimeout(window.__tqT);window.__tqT=setTimeout(function(){sync(false)},120)}};

/* ---------- لوحة «رحلتي» (مشتركة) ---------- */
function journey(me,opts){
 if(opts.compact)return journeyC(me,opts);
 var r=rec(me),st=streak(r),R=rankOf(r.cnt||0),wk=weekDays(r),act=wk.filter(function(x){return x.on}).length;
 var pct=R.nx?Math.round(((r.cnt-R.r.n)/(R.nx.n-R.r.n))*100):100;
 var bubble=opts.bubble||(st>=2?'🔥 '+st+' أيام متتالية! لا تقطع السلسلة.':act?'أحسنت! تدرّبت اليوم. هل تكمل خطوة أخرى؟':'هيّا نتدرّب اليوم!');
 if(r.days[ymd()]&&!opts.bubble)bubble=st>=2?'🔥 '+st+' أيام متتالية! أحسنت.':'تدرّبت اليوم. أحسنت! 👏';
 return '<div class="tq-j">'+
  '<div class="tq-hi">'+MASCOT+'<div class="tq-bub">'+esc(bubble)+'</div></div>'+
  (opts.cta?'<button class="tq-go" type="button" data-tq="go">'+opts.cta+'</button>':'')+
  '<div class="tq-stats">'+
   '<div class="tq-s"><span class="tq-n">🔥 '+st+'</span><small>أيام متتالية</small></div>'+
   '<div class="tq-s"><span class="tq-n">✅ '+(r.cnt||0)+'</span><small>خطوة أنجزتها</small></div>'+
   '<div class="tq-s tq-rank"><span class="tq-n">'+R.r.i+'</span><small>'+R.r.t+'</small></div>'+
  '</div>'+
  (R.nx?'<div class="tq-bar" role="img" aria-label="التقدم نحو الرتبة التالية"><i style="width:'+pct+'%"></i></div><p class="tq-nx">بقي <b>'+(R.nx.n-r.cnt)+'</b> للوصول إلى '+R.nx.i+' '+R.nx.t+'</p>':'')+
  '<div class="tq-week" aria-label="أيام التدريب هذا الأسبوع">'+wk.map(function(x,i){return '<span class="'+(x.on?'on ':'')+(x.today?'td':'')+'"><b>'+(x.on?'🔥':'○')+'</b>'+DN[i]+'</span>'}).join('')+'</div>'+
  '<button class="tq-mute" type="button" data-tq="mute" aria-label="الصوت">'+(r.mute?'🔇':'🔊')+'</button>'+
 '</div>';
}

function journeyC(me,opts){
 var r=rec(me),st=streak(r),R=rankOf(r.cnt||0);
 var bubble=opts.bubble||(r.days[ymd()]?(st>=2?'🔥 '+st+' أيام متتالية! أحسنت.':'تدرّبت اليوم. أحسنت! 👏'):(st>=1?'🔥 لا تقطع السلسلة! تدرّب اليوم.':'هيّا نتدرّب اليوم!'));
 return '<div class="tq-j tq-c">'+
  '<div class="tq-hi">'+MASCOT+'<div class="tq-bub">'+esc(bubble)+'</div></div>'+
  (opts.cta?'<button class="tq-go" type="button" data-tq="go">'+opts.cta+'</button>':'')+
  '<div class="tq-line"><span>🔥 <b>'+st+'</b> أيام</span><span>✅ <b>'+(r.cnt||0)+'</b> خطوة</span><span>'+R.r.i+' '+R.r.t+'</span></div><button class="tq-mute" type="button" data-tq="mute" aria-label="الصوت">'+(r.mute?'🔇':'🔊')+'</button>'+
 '</div>';
}

/* ---------- صفحات الصفوف ---------- */
function gradeEnhance(){
 if(preview())return;var me=who();if(!me)return;
 ['app-read','app-speak'].forEach(function(id){
  var A=document.getElementById(id);if(!A||A.hidden)return;
  var units=A.querySelector('.units');var old=A.querySelector('.tq-wrap');
  if(!units){if(old)old.remove();return}
  /* المؤشرات للمعلم لا للطالب: اترك اسم الفصل فقط */
  [].forEach.call(units.querySelectorAll('.term'),function(t){if(!t.dataset.tq){t.dataset.tq=1;t.textContent=t.textContent.split(' · ')[0]}});
  /* الخطوة التالية */
  var place=A.querySelector('.place [data-a="place"]');
  var cards=[].slice.call(units.querySelectorAll('.ucard')),target=null;
  cards.forEach(function(c){c.classList.remove('tq-next')});
  if(!place){var leveled=!!A.querySelector('[data-a="place"]'),open_=cards.filter(function(c){if(c.classList.contains('locked'))return false;var d=c.querySelectorAll('.dots i'),on=c.querySelectorAll('.dots i.on');return !d.length||on.length<d.length});
   /* بعد اختبار تحديد المستوى: أعلى مستوى مفتوح؛ في الروضة: أول حرف لم يكتمل */
   target=leveled?open_[open_.length-1]:open_[0]}
  if(target)target.classList.add('tq-next');
  var title=target?(target.querySelector('strong')||{}).textContent||'':'';
  var kind=id==='app-read'?'القراءة':'التحدث';
  var cta=place?'🧭 ابدأ الاختبار القصير':target?'▶ تابع: '+esc(title):'';
  var bub=place?'مرحبًا! نبدأ باختبار قصير لنعرف من أين تنطلق في '+kind+'.':target?null:'أنهيت كل المستويات المفتوحة! اطلب من معلمك المستوى التالي. 🏆';
  var html=journey(me,{cta:cta,bubble:bub,compact:true});
  if(old&&old.dataset.h===html)return;
  var w=el('div','tq-wrap',html);w.dataset.h=html;
  w.addEventListener('click',function(e){var b=e.target.closest('[data-tq]');if(!b)return;
   if(b.dataset.tq==='go'){remember(me,kind,title);if(place)place.click();else if(target)target.click()}
   if(b.dataset.tq==='mute'){var r=rec(me);r.mute=!r.mute;saveRec(me,r);paint(true)}});
  if(old)old.replaceWith(w);else{var anchor=A.querySelector('.place')||units;anchor.parentNode.insertBefore(w,anchor)}
  if(!units.dataset.tq){units.dataset.tq=1;units.addEventListener('click',function(e){var c=e.target.closest('.ucard');if(c&&!c.classList.contains('locked'))remember(me,kind,(c.querySelector('strong')||{}).textContent||'')})}
 });
}
function remember(me,kind,title){var r=rec(me);r.last={u:location.pathname.split('/').pop()+'#tab='+(kind==='القراءة'?'read':'speak'),k:kind,t:title,g:GRADE,ts:Date.now()};saveRec(me,r)}

/* ---------- البوابة: صفحة «أدواتي» ---------- */
function portalEnhance(){
 var app=document.getElementById('app');if(!app)return;var tools=app.querySelector('.tools');var old=app.querySelector('.tq-wrap');
 if(!tools||preview()){if(old)old.remove();return}
 var me=who();if(!me)return;var r=rec(me),L=r.last;
 var cta=L?'▶ تابع '+esc(L.k)+(L.t?': '+esc(L.t):''):'▶ ابدأ بالقراءة';
 var html=journey(me,{cta:cta,bubble:L?null:'مرحبًا '+me.name+'! أنا فصيح الصقر. هيّا نبدأ رحلتنا.'});
 if(old&&old.dataset.h===html)return;
 var w=el('div','tq-wrap',html);w.dataset.h=html;
 w.addEventListener('click',function(e){var b=e.target.closest('[data-tq]');if(!b)return;
  if(b.dataset.tq==='mute'){r=rec(me);r.mute=!r.mute;saveRec(me,r);old=null;portalEnhance();return}
  if(b.dataset.tq==='go'){var links=[].slice.call(tools.querySelectorAll('a.tool'));var want=L?(L.k==='القراءة'?'read':'speak'):'read';var a=links.filter(function(x){return x.classList.contains(want)})[0]||links[0];if(a)location.href=a.href}});
 var h1=app.querySelector('h1');if(old)old.replaceWith(w);else if(h1)h1.parentNode.insertBefore(w,h1.nextSibling);else tools.parentNode.insertBefore(w,tools);
}

/* ---------- التشغيل ---------- */
var busy=false;
function paint(force){if(busy)return;busy=true;try{if(force){[].forEach.call(document.querySelectorAll('.tq-wrap'),function(x){x.remove()})}if(GRADE)gradeEnhance();else if(!IS_GAMES)portalEnhance()}catch(e){if(window.console)console.warn('tq',e)}busy=false}
function boot(){
 sync(true);
 var me=who(),r;if(me&&!preview()){r=rec(me);if(r.cnt==null){r.cnt=steps(me);saveRec(me,r)}}
 paint();
 var mo=new MutationObserver(function(){if(!busy){clearTimeout(window.__tqP);window.__tqP=setTimeout(paint,60)}});
 mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
