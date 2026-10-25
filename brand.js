/* طلاقة · شريط الهوية: صورة الواجهة والشعار وشعارا المدرسة والقسم أعلى كل شاشة دخول */
(function(){
'use strict';
var css='.tqbrand{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px auto 14px;max-width:900px;min-height:104px;border-radius:22px;overflow:hidden;padding:10px 14px;background:#14204A url(/img/hero-sm.jpg) center 35%/cover no-repeat;box-shadow:0 4px 0 rgba(20,32,74,.18)}'+
'.tqbrand:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,32,74,.55),rgba(20,32,74,.25) 50%,rgba(20,32,74,.55))}'+
'.tqbrand>*{position:relative}.tqbrand img{width:62px;height:62px;border-radius:50%;background:#fff;object-fit:contain;padding:3px;box-shadow:0 2px 6px rgba(0,0,0,.25)}'+
'.tqbrand .tqb-m{flex:1;text-align:center;color:#fff;line-height:1.25;text-shadow:0 2px 6px rgba(0,0,0,.55)}.tqbrand .tqb-n{font-weight:800;font-size:1.35rem}.tqbrand .tqb-t{color:#F2C14E;font-weight:800;font-size:1.05rem}'+
'@media(max-width:420px){.tqbrand img{width:50px;height:50px}.tqbrand .tqb-n{font-size:1.15rem}.tqbrand .tqb-t{font-size:.95rem}}';
var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
var html='<img src="/img/logo-dept.png" alt="شعار قسم اللغة العربية"><div class="tqb-m"><div class="tqb-n">طَلَاقَة · Talaqa</div><div class="tqb-t">لِسانِي عَرَبِيٌّ مُبِينٌ</div></div><img src="/img/logo-school.png" alt="شعار المدرسة الأكاديمية الدولية">';
function place(){
 if(document.querySelector('.hero .banner'))return; /* شاشة البداية فيها الصورة الكاملة */
 var root=document.getElementById('app')||document.querySelector('main')||document.body;
 if(root.querySelector('.tqbrand'))return;
 var b=document.createElement('div');b.className='tqbrand';b.setAttribute('role','img');b.setAttribute('aria-label','طلاقة · لساني عربي مبين');b.innerHTML=html;
 var h=root.querySelector('header');
 if(h&&h.parentNode)h.parentNode.insertBefore(b,h.nextSibling);else root.insertBefore(b,root.firstChild);
}
var t=null;function sched(){if(t)return;t=setTimeout(function(){t=null;try{place()}catch(e){}},0)}
function start(){place();try{new MutationObserver(sched).observe(document.getElementById('app')||document.body,{childList:true,subtree:false})}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
