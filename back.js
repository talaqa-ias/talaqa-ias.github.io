/* طلاقة · زر الرجوع في الأدوات (back.js)
   - زر «→ رجوع» ظاهر دائمًا: يرجع شاشة واحدة داخل الأداة، وفي الشاشة الأولى يرجع إلى «أدواتي».
   - زر الرجوع في الهاتف/المتصفح يعمل بالطريقة نفسها.
   الاستخدام في الأداة: TQB.init({home:'index.html', up:function(){...ارجع شاشة واحدة ثم ارسم...}})
   وبعد كل رسم: TQB.depth(عمق الشاشة الحالية: 0 للرئيسية، 1 لما تحتها…). */
(function(){'use strict';
if(window.TQB)return;
var L=0,ign=0,C={home:'index.html',up:null},busy=false;
function goHome(){location.href=C.home}
var T={
 init:function(c){for(var k in c)C[k]=c[k];if(!document.getElementById('tqb-css')){var s=document.createElement('style');s.id='tqb-css';s.textContent='.tqb{display:inline-flex;align-items:center;gap:4px;border:2px solid #D3E4F5;background:#fff;border-radius:999px;padding:6px 14px;font:inherit;font-weight:800;color:#1D2B4F;cursor:pointer;text-decoration:none}.tqb:active{transform:translateY(1px)}';document.head.appendChild(s)}},
 depth:function(d){d=Math.max(0,d|0);
  if(d>L){while(L<d){try{history.pushState({tqb:L+1},'')}catch(e){}L++}}
  else if(d<L){var k=L-d;L=d;ign++;try{history.go(-k)}catch(e){ign--}}},
 back:function(){if(L>0){try{history.back()}catch(e){up1()}}else goHome()},
 btn:function(cls,label){return '<button type="button" class="'+(cls||'tqb')+'" data-tqb="1" aria-label="رجوع · Back">'+(label||'→ رجوع')+'</button>'}
};
function up1(){if(busy)return;busy=true;try{if(C.up){var r=C.up();if(r===false)goHome()}else goHome()}finally{busy=false}}
window.addEventListener('popstate',function(){if(ign>0){ign--;return}if(L>0){L--;up1()}});
document.addEventListener('click',function(e){var b=e.target.closest?e.target.closest('[data-tqb]'):null;if(!b)return;e.preventDefault();e.stopPropagation();T.back()},true);
window.TQB=T;
})();
