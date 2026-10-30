/* طلاقة · التقييم بسلالم القسم (score.js)
   يعرض للمعلم سلّم الكتابة أو التحدث أو القراءة لصف الطالب، مع الدليل (نص الطالب أو تسجيله)،
   فيختار مستوى كل معيار بنقرة، ويُحفظ التقييم في ورقة scores في جدول المدرسة.
   المصدر: rubrics.json (سلالم القسم، النسخة المذكورة فيه). */
(function(){
'use strict';
if(window.TQScore)return;
var R=null,OPT=null,OPEN=null,BUSY=false,MSG='';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function load(){if(R)return Promise.resolve(R);return fetch((OPT&&OPT.base||'')+'rubrics.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){R=j;return R})}
var SK={write:'✍️ الكتابة',speak:'🗣️ التحدث',read:'📖 القراءة'};
function gradeKey(sec){sec=String(sec||'').toUpperCase();if(/^KG/.test(sec))return 'KG';var m=/^G(\d)/.exec(sec);return m?'G'+m[1]:null}
function bDefault(g){return (g==='G4'||g==='G5')?'inter':'basic'}
function rubricFor(sec,sk,blv){if(!R)return null;var g=gradeKey(sec);
 if(OPT.isB){if(sk==='read')return {fluency:true,title:'قياس الطلاقة: الكلمات (أو الحروف للتمهيدي) المقروءة قراءة صحيحة في 60 ثانية',max:0,crit:[]};var b=R.B[blv||bDefault(g)];return b&&b[sk]}
 if(g==='KG')return sk==='speak'?R.KG.speak:null;
 return R.A[g]&&R.A[g][sk]}
function evidence(S,sk,ctx){var out=[];
 if(sk==='write'){(ctx.wr||[]).filter(function(w){return w.c===S.c&&w.n===S.n}).slice(-8).reverse().forEach(function(w,i){var x={};try{x=JSON.parse(w.x)}catch(e){}out.push({id:'w'+i,t:(x.title||'نص')+(x.genre?' · '+String(x.r||'').replace('ورشة الكتابة · ','')+' · '+(['','🌱 مبتدئ','🌿 متوسط','🌳 متقدم'][x.lvl]||''):' · الدرجة '+(x.r||''))+' · '+w.d,body:x.text||'',task:x.title||''})})}
 else{var kind=sk==='read'?'القراءة':'التحدث';((ctx.recl||{})[S.c+'|'+S.n]||[]).filter(function(r){return r.k===kind}).slice(-8).reverse().forEach(function(r,i){out.push({id:'r'+i,t:r.t+(r.a?' · المحاولة '+r.a:'')+' · '+r.d,u:r.u||'',task:r.t})})}
 return out}
function total(rub,lv){var t=0,n=0;(rub.crit||[]).forEach(function(c,i){if(lv[i]!=null){t+=lv[i];n++}});return {t:t,n:n,max:n*(rub.levels?rub.levels.length:5),full:(rub.crit||[]).length*(rub.levels?rub.levels.length:5)}}
function autoRead(rub,wc,er){var lv=[];var acc=(wc+er)>0?Math.floor(100*wc/(wc+er)):null;(rub.crit||[]).forEach(function(c,i){if(!c.auto)return;var v=c.auto==='wcpm'?wc:acc;if(v==null||isNaN(v))return;var L=1;c.min.forEach(function(m,j){if(m!=null&&v>=m)L=j+1});lv[i]=L});return {lv:lv,acc:acc}}

function section(S,ctx){
 if(!R){load().then(function(){rr()});return '<section class="panel"><h3>📝 التقييم بسلّم القسم</h3><p class="note">جارٍ تحميل السلالم…</p></section>'}
 var key=S.c+'|'+S.n,h='<section class="panel" id="rbsec"><h3 style="margin:0 0 6px">📝 التقييم بسلّم القسم <small style="color:var(--muted);font-weight:700">('+esc(R.version)+')</small></h3>';
 var hist=(ctx.sc||[]).filter(function(x){return x.c===S.c&&x.n===S.n});
 if(hist.length){h+='<div class="tw"><table class="mon"><thead><tr><th>التاريخ</th><th>المهارة</th><th>المهمة</th><th>الدرجة</th><th>المقيّم</th></tr></thead><tbody>'+hist.slice(-12).reverse().map(function(x){return '<tr><td>'+esc(x.d)+'</td><td>'+esc(SK[x.sk]||x.sk)+'</td><td>'+esc(x.task)+'</td><td><b>'+esc(x.tot)+'</b>'+(x.max?' / '+esc(x.max):' كلمة')+'</td><td>'+esc(x.by)+'</td></tr>'}).join('')+'</tbody></table></div>'}
 else h+='<p class="note">لا تقييمات بالسلّم لهذا الطالب بعد.</p>';
 if(!OPEN||OPEN.key!==key){h+='<div class="row" style="gap:8px;margin-top:8px">'+['write','speak','read'].map(function(sk){var r=rubricFor(S.c,sk);return r?'<button class="btn small" data-rb="open" data-sk="'+sk+'">'+SK[sk]+'</button>':''}).join('')+'</div>';
  if(gradeKey(S.c)==='KG'&&!OPT.isB)h+='<p class="note">الروضة: تُقيَّم الكتابة والقراءة بمؤشرات ملف رصد الروضة، ويُسجَّل هنا مؤشر التعبير الشفوي والحوار فقط (المستوى 1–4).</p>';
  return h+(MSG?'<p class="note"><b>'+esc(MSG)+'</b></p>':'')+'</section>'}
 var rub=rubricFor(S.c,OPEN.sk,OPEN.blv),ev=evidence(S,OPEN.sk,ctx);
 h+='<h4 style="margin:10px 0 4px">'+SK[OPEN.sk]+' · '+esc(rub.title||'')+'</h4>';
 if(OPT.isB&&OPEN.sk!=='read')h+='<div class="row" style="gap:8px;align-items:center;margin:6px 0"><b>المستوى:</b><button class="btn small'+(OPEN.blv==='basic'?'':' ghost')+'" data-rb="blv" data-v="basic">التمهيدي والمبتدئ</button><button class="btn small'+(OPEN.blv==='inter'?'':' ghost')+'" data-rb="blv" data-v="inter">المتوسط</button></div>';
 h+='<div class="panel" style="background:#F7F9FF"><b>الدليل</b>';
 if(!ev.length)h+='<p class="note">لم يصل من الطالب دليل لهذه المهارة في المنصة. يمكنك التقييم من عمل صفي أو من الدفتر، واكتب مصدره في الملاحظة.</p>';
 else h+=ev.map(function(e){return '<label style="display:block;margin:6px 0"><input type="radio" name="rbev" data-rb="ev" value="'+e.id+'"'+(OPEN.ev===e.id?' checked':'')+'> '+esc(e.t)+(e.u?' <a class="btn small ghost" href="'+esc(e.u)+'" target="_blank" rel="noopener">▶ استمع</a>':'')+(e.body&&OPEN.ev===e.id?'<div style="font-family:var(--read);font-size:1.15rem;line-height:1.9;background:#fff;border-radius:10px;padding:8px 10px;margin-top:6px;white-space:pre-wrap">'+esc(e.body)+'</div>':'')+'</label>'}).join('');
 h+='</div>';
 if(rub.fluency){h+='<label class="f">الكلمات المقروءة قراءة صحيحة في 60 ثانية<input class="in" id="rbwc" inputmode="numeric" value="'+esc(OPEN.wc==null?'':OPEN.wc)+'"></label>'}
 else{
  if(OPEN.sk==='read'&&!OPT.isB)h+='<div class="row" style="gap:10px"><label class="f">كلمات صحيحة في 60 ثانية<input class="in" id="rbwc" inputmode="numeric" value="'+esc(OPEN.wc==null?'':OPEN.wc)+'" style="max-width:120px"></label><label class="f">عدد الأخطاء<input class="in" id="rber" inputmode="numeric" value="'+esc(OPEN.er==null?'':OPEN.er)+'" style="max-width:120px"></label><button class="btn small ghost" data-rb="auto">احسب السرعة والدقة</button></div>'+(OPEN.acc!=null?'<p class="note">الدقة: '+OPEN.acc+'%</p>':'');
  var L=rub.levels||['1','2','3','4','5'];
  h+='<div class="tw"><table class="mon"><thead><tr><th>المعيار</th>'+L.map(function(x,j){return '<th>'+esc(L.length===5?(j+1)+(j===4?' ممتاز':j===0?' ضعيف جدًّا':''):x)+'</th>'}).join('')+'</tr></thead><tbody>'+rub.crit.map(function(c,i){return '<tr><td><b>'+esc(c.n)+'</b>'+(c.cls?'<br><small>🏫 يُقيَّم من الصف أو الدفتر</small>':'')+(c.auto?'<br><small>⚙️ يُحسب من الأرقام</small>':'')+'</td>'+c.d.map(function(d,j){var on=OPEN.lv[i]===j+1;return '<td style="vertical-align:top"><button type="button" class="btn small'+(on?'':' ghost')+'" data-rb="lv" data-i="'+i+'" data-j="'+(j+1)+'" style="width:100%;height:100%;white-space:normal;text-align:right;justify-content:flex-start;align-items:flex-start;font-size:.9rem;font-weight:700;line-height:1.5;padding:8px 10px">'+(on?'✔ ':'')+esc(d)+'</button></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
  var T=total(rub,OPEN.lv);h+='<p class="lead" style="margin:8px 0"><b>المجموع: '+T.t+' من '+T.max+'</b>'+(T.n<rub.crit.length?' · <span style="color:#B26A00">'+(rub.crit.length-T.n)+' معيار لم يُقيَّم (الدرجة الكاملة '+T.full+')</span>':'')+'</p>'}
 h+='<label class="f">ملاحظة للطالب أو مصدر الدليل (اختياري)<textarea class="in" id="rbnote" rows="2">'+esc(OPEN.note||'')+'</textarea></label><p class="note">قاعدة القسم: يُمنح المستوى الذي تنطبق أوصافه كلها، وعند التردد يُمنح الأدنى.</p>';
 h+='<div class="row" style="gap:8px"><button class="btn" data-rb="save"'+(BUSY?' disabled':'')+'>'+(BUSY?'جارٍ الحفظ…':'💾 احفظ التقييم')+'</button><button class="btn small ghost" data-rb="close">إلغاء</button></div>'+(MSG?'<p class="note"><b>'+esc(MSG)+'</b></p>':'');
 return h+'</section>'}

function rr(){var y=window.pageYOffset||document.documentElement.scrollTop||0;OPT.render();var back=function(){try{window.scrollTo(0,y)}catch(e){}};back();if(window.requestAnimationFrame)requestAnimationFrame(back);setTimeout(back,60)}
function cur(){var S=OPT.student&&OPT.student();return S}
document.addEventListener('input',function(e){if(!OPEN)return;var id=e.target.id;if(id==='rbnote')OPEN.note=e.target.value;if(id==='rbwc')OPEN.wc=e.target.value;if(id==='rber')OPEN.er=e.target.value});
document.addEventListener('change',function(e){var b=e.target;if(b&&b.dataset&&b.dataset.rb==='ev'&&OPEN){OPEN.ev=b.value;rr()}});
document.addEventListener('click',function(e){var b=e.target.closest('[data-rb]');if(!b||b.dataset.rb==='ev')return;var a=b.dataset.rb,S=cur();if(!S)return;MSG='';
 if(a==='open'){OPEN={key:S.c+'|'+S.n,sk:b.dataset.sk,lv:[],note:'',blv:bDefault(gradeKey(S.c))};rr();return}
 if(!OPEN)return;
 if(a==='close'){OPEN=null;rr();return}
 if(a==='blv'){OPEN.blv=b.dataset.v;OPEN.lv=[];rr();return}
 if(a==='lv'){var i=+b.dataset.i,j=+b.dataset.j;OPEN.lv[i]=OPEN.lv[i]===j?null:j;rr();return}
 if(a==='auto'){var rub=rubricFor(S.c,OPEN.sk,OPEN.blv),r=autoRead(rub,+OPEN.wc,+(OPEN.er||0));r.lv.forEach(function(v,i){if(v!=null)OPEN.lv[i]=v});OPEN.acc=r.acc;rr();return}
 if(a==='save'){if(BUSY)return;var rub2=rubricFor(S.c,OPEN.sk,OPEN.blv),ctx=OPT.ctx(),ev=evidence(S,OPEN.sk,ctx).filter(function(x){return x.id===OPEN.ev})[0],q=OPT.auth&&OPT.auth();
  if(!q){MSG='سجّل الدخول من ركن المعلم أولًا.';rr();return}
  var T=rub2.fluency?{t:+OPEN.wc||0,max:0,n:1}:total(rub2,OPEN.lv);if(!T.n){MSG='اختر مستوى معيار واحد على الأقل.';rr();return}
  var body={a:'score',r:q.r,id:q.id||'',k:q.k,sec:S.c,n:S.n,sk:OPEN.sk,task:ev?ev.task:(OPEN.note?'من الصف':'—'),rub:(OPT.isB?'B-'+OPEN.blv:gradeKey(S.c))+'-'+OPEN.sk,lv:rub2.fluency?[+OPEN.wc||0]:(rub2.crit||[]).map(function(c,i){return OPEN.lv[i]==null?null:OPEN.lv[i]}),tot:T.t,max:T.max,note:OPEN.note||'',ver:R.version,ev:ev?(ev.u||ev.t):'',g:gradeKey(S.c),port:OPT.port||'A'};
  BUSY=true;rr();
  fetch((OPT.base||'')+'send-config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){var u=String(c.progress||'');if(!u)throw new Error('off');return fetch(u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}).then(function(r){return r.json()})})
   .then(function(j){BUSY=false;if(j&&j.ok){var c2=OPT.ctx();(c2.sc=c2.sc||[]).push({d:new Date().toISOString().slice(0,10),c:S.c,n:S.n,by:'أنت',sk:body.sk,task:body.task,tot:body.tot,max:body.max});OPEN=null;MSG='✔ حُفظ التقييم في جدول المدرسة.'}else MSG='تعذّر الحفظ: '+((j&&j.err)||'خطأ');rr()})
   .catch(function(){BUSY=false;MSG='تعذّر الاتصال بالخادم. حاول مرة أخرى.';rr()});return}
});
window.TQScore={init:function(o){OPT=o;load().catch(function(){})},section:section};
})();
