/* طلاقة · خادم التقدّم التلقائي (Google Apps Script)
 * يُلصق في: جدول Google ← الإضافات ← Apps Script. ثم «نشر ← نشر جديد ← تطبيق ويب»:
 *   التنفيذ باسم: أنا · من لديه حق الوصول: أي شخص.
 * إعداد لمرة واحدة: إعدادات المشروع ← خصائص السكربت ← أضف OWNPIN = رمز المنسق.
 * لا يرسل جهاز الطالب رمز الشعبة ولا رمزه الشخصي؛ يرسل بصمة تحقق فقط.
 * يستقبل من الموقع خطوات الطالب (بعد التحقق من رمز الشعبة والرمز الشخصي)،
 * ويعطي المعلم والمنسق ملخّص التفاعل (بعد التحقق من رمز كل منهما).
 * لا يحتاج أي إعداد آخر: يقرأ قوائم الشعب ورموز المعلمين من الموقع نفسه.
 */
var SITE = 'https://talaqa-ias.github.io/index.html';
var SHEET = 'events';

/* ---------- نفس تشفير الموقع ---------- */
function fnv(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16)}
function rcStream(code,sec,n){var o=[];for(var i=0;o.length<n;i++){var h=parseInt(fnv(code+'|'+sec+'|'+i),16);o.push(h&255,(h>>>8)&255,(h>>>16)&255,(h>>>24)&255)}return o}
function rcDec(code,sec,x){var b=Utilities.base64Decode(x),k=rcStream(code,sec,b.length),out=[];for(var i=0;i<b.length;i++)out.push(((b[i]&255)^k[i])<<24>>24);return Utilities.newBlob(out).getDataAsString('UTF-8')}
function rcNorm(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}

/* ---------- بيانات الموقع (تُحدَّث تلقائيًا كل ساعة) ---------- */
function seed(force){
  var c=CacheService.getScriptCache(),k='seed_v1';
  if(!force){var hit=c.get(k);if(hit)return JSON.parse(hit)}
  var html=UrlFetchApp.fetch(SITE+'?t='+Date.now(),{muteHttpExceptions:true}).getContentText('UTF-8');
  var m=html.match(/<script type="application\/json" id="seed">([\s\S]*?)<\/script>/);
  var d=JSON.parse(m[1]);var s={secs:d.secs,teachers:d.teachers,own:d.own||null};
  try{c.put(k,JSON.stringify(s),3600)}catch(e){}
  return s;
}
/* رموز الشعب لا تُرسل من أجهزة الطلاب: يفكّها الخادم من الموقع برمز المنسق المحفوظ في خصائص السكربت (OWNPIN) */
function secCodes(S){var pin=PropertiesService.getScriptProperties().getProperty('OWNPIN');if(!pin||!S.own)return {};try{return JSON.parse(rcDec(pin,'OWN',S.own.x))}catch(e){return {}}}
function pinsOf(S,sec,code){var L=S.secs[sec];if(!L||!L.p||L.h!==fnv('rc|'+sec+'|'+code))return null;try{return JSON.parse(rcDec(code,sec,L.p))}catch(e){return null}}

function sheet(){var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName(SHEET);
  if(!sh){sh=ss.insertSheet(SHEET);sh.appendRow(['وقت الاستلام','التاريخ','الشعبة','معرّف الطالب (مستعار)','الأداة','المفتاح','القيمة','الصف']);sh.setFrozenRows(1);sh.setRightToLeft(true)}
  return sh}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}

/* ---------- استقبال خطوات الطالب ---------- */
function doPost(e){
  try{
    var b=JSON.parse(e.postData.contents),S=seed(),sec=String(b.sec||''),K=secCodes(S),c=K[sec],P=c&&pinsOf(S,sec,c);
    if(!P){S=seed(true);K=secCodes(S);c=K[sec];P=c&&pinsOf(S,sec,c)}
    /* لا أسماء في الجدول: الطالب يُعرَّف بمعرّف مستعار (sid) لا يفكّه إلا من يملك رمز الشعبة */
    var who=P&&Object.keys(P).filter(function(n){return fnv('sid|'+sec+'|'+n+'|'+c)===String(b.sid)})[0];
    if(!who||fnv('ap|'+sec+'|'+who+'|'+c+'|'+P[who])!==String(b.pf))return out({ok:false,err:'auth'});
    if(b.a==='rec')return saveRec(b,sec,who);
    var ev=(b.ev||[]).slice(0,300);if(!ev.length)return out({ok:true,n:0});
    var now=new Date(),rows=ev.map(function(x){return [now,String(x.d||'').slice(0,10),sec,String(b.sid),String(x.t||'').slice(0,12),String(x.k||'').slice(0,80),Number(x.v)||0,String(b.g||'').slice(0,4)]});
    var lock=LockService.getScriptLock();lock.waitLock(20000);
    try{var sh=sheet();sh.getRange(sh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows)}finally{lock.releaseLock()}
    return out({ok:true,n:rows.length});
  }catch(err){return out({ok:false,err:String(err)})}
}

/* ---------- التسجيلات الصوتية: مجلد لكل شعبة، وبداخله مجلد لكل طالب ---------- */
var ROOT='طلاقة · تسجيلات الطلاب';
function folder(parent,name){var it=parent?parent.getFoldersByName(name):DriveApp.getFoldersByName(name);return it.hasNext()?it.next():(parent?parent.createFolder(name):DriveApp.createFolder(name))}
function clean(s){return String(s||'').replace(/[\\/:*?"<>|#%]+/g,' ').replace(/\s+/g,' ').trim().slice(0,90)}
function saveRec(b,sec,who){
  var mime=String(b.mime||'audio/webm'),ext=mime.indexOf('mp4')>=0||mime.indexOf('m4a')>=0?'m4a':mime.indexOf('ogg')>=0?'ogg':'webm';
  var bytes=Utilities.base64Decode(String(b.b64||''));if(!bytes.length||bytes.length>8*1024*1024)return out({ok:false,err:'size'});
  var day=Utilities.formatDate(new Date(),'Asia/Dubai','yyyy-MM-dd');
  var kind=b.tool==='read'?'القراءة':'التحدث';
  var name=clean(who)+' · '+sec+' · '+kind+' · '+clean(b.title)+(b.part?' · '+clean(b.part):'')+' · '+day+'.'+ext;
  var lock=LockService.getScriptLock();lock.waitLock(25000);
  try{
    var dir=folder(folder(folder(null,ROOT),sec),clean(who));
    var old=dir.getFilesByName(name);while(old.hasNext())old.next().setTrashed(true);
    var file=dir.createFile(Utilities.newBlob(bytes,mime.split(';')[0],name));
    var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName('recs');
    if(!sh){sh=ss.insertSheet('recs');sh.appendRow(['وقت الاستلام','الشعبة','الطالب','الأداة','المهمة','الجزء','رابط الملف']);sh.setFrozenRows(1);sh.setRightToLeft(true)}
    sh.appendRow([new Date(),sec,who,kind,clean(b.title),clean(b.part),file.getUrl()]);
    var ev=sheet();ev.appendRow([new Date(),day,sec,String(b.sid),'a',clean(b.tool)+'|'+clean(b.title)+'|'+clean(b.part),1,String(b.g||'').slice(0,4)]);
    return out({ok:true,url:file.getUrl()});
  }finally{lock.releaseLock()}
}
/* لتجهيز الأذونات مرة واحدة من المحرر: اختر authorize ثم Run */
function authorize(){DriveApp.getRootFolder();SpreadsheetApp.getActive();UrlFetchApp.fetch(SITE,{muteHttpExceptions:true})}

/* ---------- ملخّص للمعلم أو المنسق ---------- */
function doGet(e){
  var q=e.parameter||{},S=seed(),allowed=null;
  if(q.a==='ping')return out({ok:true});
  /* حماية من تخمين الرموز: 10 محاولات خاطئة تقفل 15 دقيقة */
  var C=CacheService.getScriptCache(),fk='f_'+(q.r||'')+'_'+(q.id||''),fails=Number(C.get(fk)||0);
  if(fails>=10)return out({ok:false,err:'locked'});
  function bad(){C.put(fk,String(fails+1),900);return out({ok:false,err:'auth'})}
  if(q.r==='own'){if(!S.own||fnv('own|'+String(q.k||''))!==S.own.h)return bad();allowed=null}
  else if(q.r==='t'){var t=(S.teachers||[]).filter(function(x){return x.id===q.id})[0];if(!t||fnv('tp|'+t.id+'|'+String(q.k||''))!==t.h)return bad();allowed={};t.secs.forEach(function(s){allowed[s]=1})}
  else return out({ok:false,err:'role'});
  var v=sheet().getDataRange().getValues(),st={};
  for(var i=1;i<v.length;i++){var r=v[i],sec=r[2],nm=r[3];if(allowed&&!allowed[sec])continue;
    var key=sec+'|'+nm,o=st[key]||(st[key]={c:sec,n:nm,days:{},last:'',t:{}}),d=r[1]instanceof Date?Utilities.formatDate(r[1],'Asia/Dubai','yyyy-MM-dd'):String(r[1]);
    o.days[d]=1;if(d>o.last)o.last=d;
    var tl=r[4],k=r[5];if(tl==='v')continue;
    var T=o.t[tl]||(o.t[tl]={k:{},u:{},d:'',g:0});
    if(tl==='g'){T.g=Math.max(T.g,Number(r[6])||0)}else{T.k[k]=Math.max(T.k[k]||0,Number(r[6])||0);T.u[String(k).split('|')[0]]=1}
    if(d>T.d)T.d=d}
  var list=Object.keys(st).map(function(key){var o=st[key],tools={};Object.keys(o.t).forEach(function(tl){var T=o.t[tl];tools[tl]={d:T.d,done:Object.keys(T.k).length,units:Object.keys(T.u).length,g:T.g}});return {c:o.c,n:o.n,last:o.last,days:Object.keys(o.days).length,tools:tools}});
  return out({ok:true,at:new Date().toISOString(),rows:list});
}

/* ---------- الاحتفاظ: حذف ما قبل بداية العام الدراسي (يُشغَّل يدويًا أو بمؤقّت سنوي) ---------- */
function purgeBefore(dateStr){var sh=sheet(),v=sh.getDataRange().getValues(),keep=[v[0]];for(var i=1;i<v.length;i++){var d=v[i][1] instanceof Date?Utilities.formatDate(v[i][1],'Asia/Dubai','yyyy-MM-dd'):String(v[i][1]);if(d>=dateStr)keep.push(v[i])}sh.clearContents();sh.getRange(1,1,keep.length,keep[0].length).setValues(keep)}
