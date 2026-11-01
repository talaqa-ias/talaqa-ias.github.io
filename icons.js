/* طلاقة · عرض الأدوات أيقونات (icons.js)
   يحوّل بطاقات الأدوات (a.tool) في صفحة «أدواتي» إلى أيقونات مثل تطبيقات الجوال، مجمّعة حسب المهارة.
   لا يغيّر الروابط ولا الخطط؛ يعيد ترتيب العرض فقط. */
(function(){'use strict';
var S='fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"',F='rgba(255,255,255,.2)';
var SVG={
 book:'<svg viewBox="0 0 48 48" '+S+'><path d="M24 12c-4-3-10-4-16-3v27c6-1 12 0 16 3 4-3 10-4 16-3V9c-6-1-12 0-16 3z" fill="'+F+'"/><path d="M24 12v27"/></svg>',
 talk:'<svg viewBox="0 0 48 48" '+S+'><path d="M8 11h32a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H22l-9 7v-7H8a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z" fill="'+F+'"/><path d="M15 21h18M15 26h11"/></svg>',
 head:'<svg viewBox="0 0 48 48" '+S+'><path d="M9 29v-5a15 15 0 0 1 30 0v5"/><rect x="7" y="27" width="8" height="12" rx="3" fill="rgba(255,255,255,.3)"/><rect x="33" y="27" width="8" height="12" rx="3" fill="rgba(255,255,255,.3)"/></svg>',
 ear:'<svg viewBox="0 0 48 48" '+S+'><path d="M16 20a10 10 0 0 1 20 0c0 6-6 8-6 14a5 5 0 0 1-9 3" fill="'+F+'"/><path d="M22 21a3 3 0 0 1 6 0c0 3-3 4-3 6"/></svg>',
 pencil:'<svg viewBox="0 0 48 48" '+S+'><path d="M31 8l9 9-20 20-11 2 2-11z" fill="'+F+'"/><path d="M27 12l9 9"/></svg>',
 paper:'<svg viewBox="0 0 48 48" '+S+'><path d="M10 7h20l8 8v26a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="'+F+'"/><path d="M14 18h14M14 24h10"/><path d="M36 22l6 6-12 12-7 1 1-7z" fill="#fff" fill-opacity=".35"/></svg>',
 abc:'<svg viewBox="0 0 48 48" '+S+'><rect x="7" y="9" width="34" height="30" rx="5" fill="'+F+'"/><text x="24" y="31" text-anchor="middle" font-size="19" font-weight="800" fill="#fff" stroke="none" font-family="Noto Naskh Arabic,serif">أ ب</text></svg>',
 game:'<svg viewBox="0 0 48 48" '+S+'><path d="M14 17h20a8 8 0 0 1 7.6 10.5l-2 6a4 4 0 0 1-6.6 1.6L29 31H19l-4 4.1a4 4 0 0 1-6.6-1.6l-2-6A8 8 0 0 1 14 17z" fill="'+F+'"/><path d="M15 22v6M12 25h6"/><circle cx="31" cy="23" r="1.7" fill="#fff"/><circle cx="35" cy="27" r="1.7" fill="#fff"/></svg>'
};
var GR={read:['📖','أقرأ','Read'],speak:['🗣️','أتحدث','Speak'],listen:['🎧','أستمع','Listen'],write:['✍️','أكتب','Write'],play:['🎮','ألعب','Play']};
var COL={read:'linear-gradient(145deg,#3FA9FF,#1F6FE0)',speak:'linear-gradient(145deg,#FFB44A,#FF7A1A)',listen:'linear-gradient(145deg,#B07CFF,#7B45E8)',write:'linear-gradient(145deg,#4FD98A,#16A85A)',paper:'linear-gradient(145deg,#FF7AA8,#E8457E)',play:'linear-gradient(145deg,#FFD84D,#F2A900)'};
function kind(a){var h=a.getAttribute('href')||'',c=a.className||'';
 if(/games\.html/.test(h))return ['play','game','play'];
 if(/ws\.html/.test(h))return ['write','paper','paper'];
 if(/imla\.html/.test(h))return ['write','pencil','write'];
 if(/kgw\.html/.test(h))return ['write','abc','write'];
 if(/bsk\.html\?k=write/.test(h))return ['write','paper','paper'];
 if(/bsk\.html/.test(h))return ['read','book','read'];
 if(/listen\.html/.test(h))return ['listen','head','listen'];
 if(/aal-r-/.test(h))return ['speak','talk','speak'];
 if(/aal-(kg|g)\d/.test(h))return ['listen','ear','listen'];
 if(/tab=read/.test(h)||/\bread\b/.test(c))return ['read','book','read'];
 if(/tab=speak/.test(h)||/\bspeak\b/.test(c))return ['speak','talk','speak'];
 if(/\bwrite\b/.test(c))return ['write','pencil','write'];
 return ['read','book','read']}
var css='.tqi-sec{margin:18px 0 8px;display:flex;align-items:center;gap:8px;font-weight:800;color:#5B6B8C;font-size:1rem}.tqi-sec i{flex:1;height:2px;background:#D3E4F5}.tqi-sec .en{font-size:.8rem;font-weight:600;opacity:.8}'+
'.tqi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:18px 10px}'+
'.tqi{display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;color:inherit;position:relative;padding:2px;border-radius:20px}'+
'.tqi:focus-visible{outline:4px solid #FFC83D;outline-offset:2px}'+
'.tqi .ic{width:84px;height:84px;border-radius:24px;display:grid;place-items:center;box-shadow:0 6px 0 rgba(0,0,0,.13),0 10px 18px rgba(29,43,79,.12);position:relative;overflow:hidden;transition:transform .12s}'+
'.tqi:active .ic{transform:translateY(3px);box-shadow:0 3px 0 rgba(0,0,0,.13)}'+
'.tqi .ic::after{content:"";position:absolute;inset:0 0 52% 0;background:linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,0));border-radius:24px 24px 50% 50%/24px 24px 18px 18px}'+
'.tqi .ic svg{width:48px;height:48px;position:relative;z-index:1}'+
'.tqi b{font-weight:800;font-size:.95rem;text-align:center;line-height:1.25}'+
'.tqi small{font-weight:600;color:#5B6B8C;font-size:.72rem;text-align:center;line-height:1.3}'+
'.tqi .bd{position:absolute;top:-6px;inset-inline-end:6px;background:#FF4D4D;color:#fff;font-size:.7rem;font-weight:800;border-radius:999px;padding:1px 8px;border:2px solid #fff;z-index:2}'+
'.tqi.plan .ic{box-shadow:0 0 0 4px #22B866,0 6px 0 rgba(0,0,0,.13)}.tqi .pl{background:#DDF7E8;color:#11753E;border-radius:999px;padding:1px 8px;font-size:.72rem;font-weight:800}';
function apply(root){var box=root.querySelector('.tools');var all=[].slice.call(root.querySelectorAll('a.tool'));if(!all.length||root.querySelector('.tqi'))return;
 if(!document.getElementById('tqi-css')){var st=document.createElement('style');st.id='tqi-css';st.textContent=css;document.head.appendChild(st)}
 var groups={read:[],speak:[],listen:[],write:[],play:[]};
 all.forEach(function(a){var k=kind(a),t=a.querySelector('strong'),sm=a.querySelector('small'),tags=[].slice.call(a.querySelectorAll('.tag'));
  var badge='',plan='',sub='';tags.forEach(function(g){var x=g.textContent.trim();if(/جديد|New|تجربة/.test(x))badge=/تجربة/.test(x)?'تجربة':'جديد';else if(/المطلوب|رمز المستوى/.test(x))plan+='<span class="pl">'+x.replace(/</g,'&lt;')+'</span>';else sub=x});
  var n=document.createElement('a');n.className='tqi'+(plan?' plan':'');n.href=a.getAttribute('href');n.title=(sm?sm.textContent:'');
  n.innerHTML=(badge?'<span class="bd">'+badge+'</span>':'')+'<span class="ic" style="background:'+COL[k[2]]+'">'+SVG[k[1]]+'</span><b>'+(t?t.innerHTML:'')+'</b>'+(sub?'<small>'+sub.replace(/</g,'&lt;')+'</small>':'')+plan;
  groups[k[0]].push(n)});
 var wrap=document.createElement('div');wrap.className='tqi-wrap';
 ['read','speak','listen','write','play'].forEach(function(g){if(!groups[g].length)return;var h=document.createElement('div');h.className='tqi-sec';h.innerHTML=GR[g][0]+' '+GR[g][1]+' <span class="en">· '+GR[g][2]+'</span><i></i>';wrap.appendChild(h);var gr=document.createElement('div');gr.className='tqi-grid';groups[g].forEach(function(x){gr.appendChild(x)});wrap.appendChild(gr)});
 var first=box||all[0];first.parentNode.insertBefore(wrap,first);
 all.forEach(function(a){a.remove()});if(box&&!box.children.length)box.remove()}
function run(){var r=document.getElementById('app')||document.body;try{apply(r)}catch(e){}}
var mo=new MutationObserver(function(){run()});
document.addEventListener('DOMContentLoaded',function(){run();mo.observe(document.getElementById('app')||document.body,{childList:true,subtree:false})});
window.TQIcons={apply:apply};
})();
