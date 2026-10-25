/* طلاقة · زر الرجوع الموحّد (nav.js)
   يحفظ تسلسل الشاشات داخل الصفحة (البوابة، وتبويبات الصف، وداخل أداتي القراءة والتحدث)
   ويعيد خطوة واحدة فقط عند الضغط على «رجوع» أو زر الرجوع في الهاتف/المتصفح.
   لا يحفظ أي بيانات، ولا يغيّر تقدّم الطالب. */
(function(){
'use strict';
if(window.__tqNav)return;
var st=[],H={},cur={},quiet=false,ready=false;
function snap(){var o={};for(var k in cur)o[k]=cur[k];return o}
function restore(e){quiet=true;try{var order=['portal','tab','read','speak'];order.concat(Object.keys(e.v)).forEach(function(k,i,arr){if(arr.indexOf(k)!==i)return;if(e.v[k]==null||!H[k])return;try{H[k](JSON.parse(e.v[k]))}catch(err){}})}finally{quiet=false}N.paint()}
var N={
 reg:function(k,f){H[k]=f},
 /* تحديث حالة مصدر دون تسجيل شاشة جديدة (مثلًا أداة مخفية) */
 set:function(k,v){cur[k]=JSON.stringify(v===undefined?null:v);var top=st[st.length-1];if(top)top.v[k]=cur[k]},
 /* تسجيل شاشة جديدة. k: المصدر · id: هوية الشاشة · v: حالتها */
 push:function(k,id,v){
  cur[k]=JSON.stringify(v===undefined?null:v);
  if(quiet){var t=st[st.length-1];if(t)t.v[k]=cur[k];return}
  var top=st[st.length-1],key=k+'|'+id;
  if(top&&(top.key===key||!ready)){top.key=key;top.v=snap();N.paint();return}
  var e={key:key,v:snap(),h:false};
  if(st.length){try{history.pushState({tq:st.length+1},'');e.h=true}catch(err){}}
  st.push(e);N.paint()
 },
 can:function(){return st.length>1},
 back:function(){
  if(st.length<2)return false;
  var top=st[st.length-1];
  if(top.h){try{history.back();return true}catch(err){}}
  st.pop();restore(st[st.length-1]);return true
 },
 paint:function(){var can=N.can(),bs=document.querySelectorAll('[data-nav="back"]');for(var i=0;i<bs.length;i++)bs[i].hidden=!can},
 btn:function(cls){return '<button type="button" class="'+(cls||'chip')+'" data-nav="back" hidden aria-label="رجوع">→ رجوع</button>'}
};
window.addEventListener('popstate',function(){if(st.length>1){var top=st[st.length-1];if(top.h){st.pop();restore(st[st.length-1])}}});
window.addEventListener('load',function(){ready=true});
document.addEventListener('click',function(e){var b=e.target.closest?e.target.closest('[data-nav="back"]'):null;if(!b)return;e.preventDefault();N.back()},true);
window.__tqNav=N;
})();
