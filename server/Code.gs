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
function seed(force,port){
  var c=CacheService.getScriptCache(),k='seed_v1'+(port==='B'?'_b':'');
  if(!force){var hit=c.get(k);if(hit)return JSON.parse(hit)}
  var html=UrlFetchApp.fetch((port==='B'?SITE.replace(/index\.html$/,'b/index.html'):SITE)+'?t='+Date.now(),{muteHttpExceptions:true}).getContentText('UTF-8');
  var m=html.match(/<script type="application\/json" id="seed">([\s\S]*?)<\/script>/);
  var d=JSON.parse(m[1]);var s={secs:d.secs,teachers:d.teachers,own:d.own||null};
  try{c.put(k,JSON.stringify(s),3600)}catch(e){}
  return s;
}
/* رموز الشعب لا تُرسل من أجهزة الطلاب: يفكّها الخادم من الموقع برمز المنسق المحفوظ في خصائص السكربت (OWNPIN) */
function secCodes(S){var pin=PropertiesService.getScriptProperties().getProperty('OWNPIN');if(!pin||!S.own)return {};try{return JSON.parse(rcDec(pin,'OWN',S.own.x))}catch(e){return {}}}
function pinsOf(S,sec,code){var L=S.secs[sec];if(!L||!L.p||L.h!==fnv('rc|'+sec+'|'+code))return null;try{return JSON.parse(rcDec(code,sec,L.p))}catch(e){return null}}

function sheet(){var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName(SHEET);
  if(!sh){sh=ss.insertSheet(SHEET);sh.appendRow(['وقت الاستلام','التاريخ','الشعبة','الطالب','الأداة','المفتاح','القيمة','الصف','النشاط']);sh.setFrozenRows(1);sh.setRightToLeft(true)}
  else if(sh.getRange(1,4).getValue()!=='الطالب'){sh.getRange(1,4).setValue('الطالب');sh.getRange(1,9).setValue('النشاط')}
  return sh}
var KIND={v:'زيارة',r:'قراءة',s:'تحدث',g:'ألعاب',a:'تسجيل صوتي'};
/* رموز الإنجاز التفصيلية (سرعة القراءة، طريقة التحقق، القياس الصفي، تقييم التحدث) تُحفظ آخر نسخة منها */
function codeSheet(){var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName('codes');if(!sh){sh=ss.insertSheet('codes');sh.appendRow(['وقت الاستلام','الشعبة','الطالب','النوع','الرمز التفصيلي']);sh.setFrozenRows(1);sh.setRightToLeft(true)}else if(sh.getRange(1,3).getValue()!=='الطالب')sh.getRange(1,3).setValue('الطالب');return sh}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}

/* ---------- استقبال خطوات الطالب ---------- */
function doPost(e){
  try{
    var b0=JSON.parse(e.postData.contents);if(b0.a==='score')return saveScore(b0);
    var b=b0,S=seed(),sec=String(b.sec||''),K=secCodes(S),c=K[sec],P=c&&pinsOf(S,sec,c);
    if(!P){S=seed(true);K=secCodes(S);c=K[sec];P=c&&pinsOf(S,sec,c)}
    /* لا أسماء في الجدول: الطالب يُعرَّف بمعرّف مستعار (sid) لا يفكّه إلا من يملك رمز الشعبة */
    var who=P&&Object.keys(P).filter(function(n){return fnv('sid|'+sec+'|'+n+'|'+c)===String(b.sid)})[0];
    if(!who||fnv('ap|'+sec+'|'+who+'|'+c+'|'+P[who])!==String(b.pf))return out({ok:false,err:'auth'});
    if(b.a==='rec')return saveRec(b,sec,who);
    var all=(b.ev||[]).slice(0,300),cs=all.filter(function(x){return x.t==='code'}),ev=all.filter(function(x){return x.t!=='code'});
    if(cs.length){var lk=LockService.getScriptLock();lk.waitLock(20000);try{var cx=codeSheet();cs.forEach(function(x){cx.appendRow([new Date(),sec,who,String(x.k||'').slice(0,4),String(x.c||'').slice(0,45000)])})}finally{lk.releaseLock()}}
    if(!ev.length)return out({ok:true,n:cs.length});
    var now=new Date(),rows=ev.map(function(x){var t=String(x.t||'').slice(0,12);return [now,String(x.d||'').slice(0,10),sec,who,t,String(x.k||'').slice(0,80),Number(x.v)||0,String(b.g||'').slice(0,4),KIND[t]||t]});
    var lock=LockService.getScriptLock();lock.waitLock(20000);
    try{var sh=sheet();sh.getRange(sh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows)}finally{lock.releaseLock()}
    return out({ok:true,n:rows.length});
  }catch(err){return out({ok:false,err:String(err)})}
}


/* ---------- التقييم بسلالم القسم (المعلم أو المنسق) ----------
   ورقة scores: سطر لكل تقييم: الطالب، المهارة، المهمة، مستوى كل معيار، المجموع، ملاحظة المعلم */
function scoreSheet(){var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName('scores');
  if(!sh){sh=ss.insertSheet('scores');sh.appendRow(['وقت التقييم','التاريخ','الشعبة','الطالب','المقيّم','المهارة','المهمة','السلّم','مستويات المعايير','المجموع','من','ملاحظة','نسخة السلّم','الدليل']);sh.setFrozenRows(1);sh.setRightToLeft(true);sh.getRange(1,1,1,14).setFontWeight('bold')}
  return sh}
function staffAuth(S,r,id,k){
  if(r==='own'){if(S.own&&fnv('own|'+String(k||''))===S.own.h)return {name:'منسق القسم',allowed:null};return null}
  var t=(S.teachers||[]).filter(function(x){return x.id===id})[0];if(!t||fnv('tp|'+t.id+'|'+String(k||''))!==t.h)return null;
  var al={};t.secs.forEach(function(s){al[s]=1});return {name:t.name,allowed:al}}
function saveScore(b){
  var B=b.port==='B',S=seed(false,B?'B':''),who=staffAuth(S,b.r,b.id,b.k);if(!who)return out({ok:false,err:'auth'});
  var sec=String(b.sec||'');if(who.allowed&&!who.allowed[sec])return out({ok:false,err:'sec'});
  var K=secCodes(S),c=K[sec],P=c&&pinsOf(S,sec,c),n=String(b.n||'');if(!P||!P[n]){S=seed(true,B?'B':'');K=secCodes(S);c=K[sec];P=c&&pinsOf(S,sec,c)}if(!P||!P[n])return out({ok:false,err:'student'});if(B)sec=sec+' · ب';
  var day=Utilities.formatDate(new Date(),'Asia/Dubai','yyyy-MM-dd'),lv=(b.lv||[]).map(function(x){return x==null?'-':String(x)}).join(' ');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{scoreSheet().appendRow([new Date(),day,sec,n,who.name,clean(b.sk),clean(b.task),clean(b.rub),lv,Number(b.tot)||0,Number(b.max)||0,String(b.note||'').slice(0,500),clean(b.ver),String(b.ev||'').slice(0,300)]);
    sheet().appendRow([new Date(),day,sec,n,'rb',clean(b.sk)+'|'+clean(b.task),Number(b.tot)||0,String(b.g||'').slice(0,4),'تقييم بالسلّم: '+clean(b.sk)+' · '+(Number(b.tot)||0)+' من '+(Number(b.max)||0)])}
  finally{lock.releaseLock()}
  return out({ok:true})}

/* ---------- التسجيلات الصوتية ----------
   Drive: «طلاقة · تسجيلات الطلاب» ← المرحلة ← الشعبة ← الطالب ← القراءة/التحدث ← «المهمة · المحاولة N · التاريخ»
   الجدول: ورقة recs (كل التسجيلات)، وورقة لكل مرحلة فيها سطر لكل (طالب، مهمة) وأعمدة المحاولة 1، 2، 3… */
var ROOT='طلاقة · تسجيلات الطلاب';
function gradeName(sec){var s=String(sec||'').toUpperCase();if(/^KG/.test(s))return 'الروضة';var m=s.match(/^G(\d)/);return m?({'1':'الصف الأول','2':'الصف الثاني','3':'الصف الثالث','4':'الصف الرابع','5':'الصف الخامس'})[m[1]]||('الصف '+m[1]):'أخرى'}
function folder(parent,name){var it=parent?parent.getFoldersByName(name):DriveApp.getFoldersByName(name);return it.hasNext()?it.next():(parent?parent.createFolder(name):DriveApp.createFolder(name))}
function studentDir(sec,who,kind){return folder(folder(folder(folder(folder(null,ROOT),gradeName(sec)),sec),clean(who)),kind)}
function clean(s){return String(s||'').replace(/[\\/:*?"<>|#%]+/g,' ').replace(/\s+/g,' ').trim().slice(0,90)}
function recSheet(){var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName('recs');
  if(!sh){sh=ss.insertSheet('recs');sh.appendRow(['وقت الاستلام','الشعبة','الطالب','الأداة','المهمة','الجزء','رابط الملف','المحاولة','المرحلة']);sh.setFrozenRows(1);sh.setRightToLeft(true)}
  else if(sh.getRange(1,8).getValue()!=='المحاولة'){sh.getRange(1,8).setValue('المحاولة');sh.getRange(1,9).setValue('المرحلة')}
  return sh}
/* رقم المحاولة = عدد التسجيلات السابقة للمهمة نفسها (والجزء نفسه) + 1 */
function nextAttempt(sh,sec,who,kind,title,part){var v=sh.getDataRange().getValues(),n=0;for(var i=1;i<v.length;i++){var r=v[i];if(r[1]===sec&&r[2]===who&&r[3]===kind&&r[4]===title&&String(r[5]||'')===String(part||''))n++}return n+1}
/* ورقة المرحلة: سطر لكل (طالب، أداة، مهمة، جزء) وعمود لكل محاولة */
function gradeSheet(g){var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName(g);
  if(!sh){sh=ss.insertSheet(g);sh.appendRow(['الطالب','الشعبة','الأداة','المهمة','الجزء','المحاولة 1','المحاولة 2','المحاولة 3']);sh.setFrozenRows(1);sh.setFrozenColumns(0);sh.setRightToLeft(true);sh.getRange(1,1,1,8).setFontWeight('bold')}
  return sh}
function gradeUpsert(sec,who,kind,title,part,attempt,day,url){
  var sh=gradeSheet(gradeName(sec)),v=sh.getDataRange().getValues(),row=-1;
  for(var i=1;i<v.length;i++){var r=v[i];if(r[0]===who&&r[1]===sec&&r[2]===kind&&r[3]===title&&String(r[4]||'')===String(part||'')){row=i+1;break}}
  if(row<0){sh.appendRow([who,sec,kind,title,part||'']);row=sh.getLastRow()}
  var col=5+attempt,last=sh.getLastColumn();
  if(col>last){for(var c=last+1;c<=col;c++)sh.getRange(1,c).setValue('المحاولة '+(c-5)).setFontWeight('bold')}
  sh.getRange(row,col).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(day).setLinkUrl(url).build());
}
function saveRec(b,sec,who){
  var mime=String(b.mime||'audio/webm'),ext=mime.indexOf('mp4')>=0||mime.indexOf('m4a')>=0?'m4a':mime.indexOf('ogg')>=0?'ogg':'webm';
  var bytes=Utilities.base64Decode(String(b.b64||''));if(!bytes.length||bytes.length>8*1024*1024)return out({ok:false,err:'size'});
  var day=Utilities.formatDate(new Date(),'Asia/Dubai','yyyy-MM-dd');
  var kind=b.tool==='read'?'القراءة':'التحدث',title=clean(b.title),part=clean(b.part);
  var lock=LockService.getScriptLock();lock.waitLock(25000);
  try{
    var sh=recSheet(),attempt=nextAttempt(sh,sec,who,kind,title,part);
    var name=title+(part?' · '+part:'')+' · المحاولة '+attempt+' · '+day+'.'+ext;
    var dir=studentDir(sec,who,kind);
    var file=dir.createFile(Utilities.newBlob(bytes,mime.split(';')[0],name));
    sh.appendRow([new Date(),sec,who,kind,title,part,file.getUrl(),attempt,gradeName(sec)]);
    gradeUpsert(sec,who,kind,title,part,attempt,day,file.getUrl());
    var ev=sheet();ev.appendRow([new Date(),day,sec,who,'a',clean(b.tool)+'|'+title+'|'+part,attempt,String(b.g||'').slice(0,4),'تسجيل صوتي: '+kind+' · '+title+(part?' · '+part:'')+' · المحاولة '+attempt]);
    return out({ok:true,url:file.getUrl(),attempt:attempt});
  }finally{lock.releaseLock()}
}
/* ---------- نقل التسجيلات القديمة إلى البنية الجديدة (يُشغَّل مرة واحدة من المحرر: reorganizeExisting ثم Run) ---------- */
function reorganizeExisting(){
  var sh=recSheet(),v=sh.getDataRange().getValues(),seen={},moved=0;
  for(var i=1;i<v.length;i++){var r=v[i];if(r[7])continue; /* له محاولة = منقول */
    var sec=r[1],who=r[2],kind=r[3],title=r[4],part=String(r[5]||''),url=String(r[6]||''),k=[sec,who,kind,title,part].join('|');
    seen[k]=(seen[k]||0)+1;var attempt=seen[k],idm=url.match(/\/d\/([^/]+)/);
    var day=r[0]instanceof Date?Utilities.formatDate(r[0],'Asia/Dubai','yyyy-MM-dd'):String(r[0]).slice(0,10);
    if(idm){try{var f=DriveApp.getFileById(idm[1]),ext=(f.getName().match(/\.(\w+)$/)||['','webm'])[1];f.setName(title+(part?' · '+part:'')+' · المحاولة '+attempt+' · '+day+'.'+ext);f.moveTo(studentDir(sec,who,kind));moved++}catch(e){}}
    sh.getRange(i+1,8).setValue(attempt);sh.getRange(i+1,9).setValue(gradeName(sec));
    gradeUpsert(sec,who,kind,title,part,attempt,day,url);
  }
  /* حذف مجلدات الشعب القديمة الفارغة تحت الجذر */
  var rt=DriveApp.getFoldersByName(ROOT);if(rt.hasNext()){var R=rt.next(),it=R.getFolders();while(it.hasNext()){var sf=it.next();if(/^(KG|G)\d/i.test(sf.getName())&&!sf.getFiles().hasNext()){var sub=sf.getFolders(),empty=true;while(sub.hasNext()){var p=sub.next();if(p.getFiles().hasNext()||p.getFolders().hasNext()){empty=false;break}}if(empty)sf.setTrashed(true)}}}
  Logger.log('moved '+moved+' files');
}
/* لتجهيز الأذونات مرة واحدة من المحرر: اختر authorize ثم Run */
function authorize(){var f=DriveApp.createFolder('طلاقة-اختبار-الإذن');f.setTrashed(true);SpreadsheetApp.getActive();UrlFetchApp.fetch(SITE,{muteHttpExceptions:true})}

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
    var T=o.t[tl]||(o.t[tl]={k:{},u:{},d:'',g:0,gw:{}});
    if(tl==='g'){T.g=Math.max(T.g,Number(r[6])||0);T.gw[k]=Math.max(T.gw[k]||0,Number(r[6])||0)}else{T.k[k]=Math.max(T.k[k]||0,Number(r[6])||0);T.u[String(k).split('|')[0]]=1}
    if(d>T.d)T.d=d}
  var list=Object.keys(st).map(function(key){var o=st[key],tools={};Object.keys(o.t).forEach(function(tl){var T=o.t[tl];tools[tl]={d:T.d,done:Object.keys(T.k).length,units:Object.keys(T.u).length,g:T.g,gw:T.gw}});return {c:o.c,n:o.n,last:o.last,days:Object.keys(o.days).length,tools:tools}});
  var codes={},cs=SpreadsheetApp.getActive().getSheetByName('codes');
  if(cs){var cv=cs.getDataRange().getValues();for(var j=1;j<cv.length;j++){var x=cv[j];if(allowed&&!allowed[x[1]]&&x[3]!=='HR3')continue;codes[x[1]+'|'+x[2]+'|'+x[3]+(x[3]==='HR3'?'|'+j:'')]=String(x[4])}}
  var res={ok:true,at:new Date().toISOString(),rows:list,codes:Object.keys(codes).map(function(k){return codes[k]})};
  if(q.f==='1'){var fl={},rc={},rs=SpreadsheetApp.getActive().getSheetByName('recs');
    if(rs){var rv=rs.getDataRange().getValues(),seen={};for(var m=1;m<rv.length;m++){var y=rv[m];if(allowed&&!allowed[y[1]])continue;rc[y[1]+'|'+y[2]]=(rc[y[1]+'|'+y[2]]||0)+1}}
    var rt=DriveApp.getFoldersByName(ROOT);if(rt.hasNext()){var R=rt.next(),gi=R.getFolders();while(gi.hasNext()){var gf=gi.next(),si=/^(KG|G)\d/i.test(gf.getName())?[gf]:null,sl=[];if(si)sl=si;else{var x=gf.getFolders();while(x.hasNext())sl.push(x.next())}
      sl.forEach(function(sf){var sn=sf.getName();if(allowed&&!allowed[sn])return;var pi=sf.getFolders();while(pi.hasNext()){var pf=pi.next();fl[sn+'|'+pf.getName()]=pf.getUrl()}})}}
    res.folders=fl;res.recs=rc;
    if(rs){var rl={},rv2=rs.getDataRange().getValues();for(var m2=1;m2<rv2.length;m2++){var y2=rv2[m2];if(allowed&&!allowed[y2[1]])continue;var kk=y2[1]+'|'+y2[2];(rl[kk]=rl[kk]||[]).push({k:y2[3],t:y2[4]+(y2[5]?' · '+y2[5]:''),a:y2[7]||'',u:String(y2[6]||''),d:y2[0]instanceof Date?Utilities.formatDate(y2[0],'Asia/Dubai','yyyy-MM-dd'):String(y2[0]).slice(0,10)})}res.recl=rl}}
  if(q.d==='1'){var EV={};for(var i2=1;i2<v.length;i2++){var r2=v[i2];if(r2[4]==='v')continue;if(allowed&&!allowed[r2[2]])continue;var k2=r2[2]+'|'+r2[3],L2=EV[k2]=EV[k2]||[];var d2=r2[1]instanceof Date?Utilities.formatDate(r2[1],'Asia/Dubai','yyyy-MM-dd'):String(r2[1]);L2.push({d:d2,a:String(r2[8]||r2[4])+(r2[4]==='a'?'':' · '+String(r2[5]||'').replace(/\|/g,' › '))});if(L2.length>80)L2.shift()}res.ev=EV}
  if(q.w==='1'){var wr=[],cs2=SpreadsheetApp.getActive().getSheetByName('codes');
    if(cs2){var cv2=cs2.getDataRange().getValues();for(var w2=1;w2<cv2.length;w2++){var y=cv2[w2];if(y[3]!=='WRT')continue;if(allowed&&!allowed[y[1]])continue;wr.push({c:y[1],n:y[2],d:y[0] instanceof Date?Utilities.formatDate(y[0],'Asia/Dubai','yyyy-MM-dd'):String(y[0]).slice(0,10),x:String(y[4])})}}
    res.wr=wr.slice(-1500);var sc=[],ss2=SpreadsheetApp.getActive().getSheetByName('scores');
    if(ss2){var sv=ss2.getDataRange().getValues();for(var s2=1;s2<sv.length;s2++){var z=sv[s2];if(allowed&&!allowed[z[2]])continue;sc.push({d:z[1] instanceof Date?Utilities.formatDate(z[1],'Asia/Dubai','yyyy-MM-dd'):String(z[1]),c:z[2],n:z[3],by:z[4],sk:z[5],task:z[6],rub:z[7],lv:String(z[8]),tot:z[9],max:z[10],note:z[11]})}}
    res.sc=sc.slice(-3000)}
  return out(res);
}

/* ---------- الاحتفاظ: حذف ما قبل بداية العام الدراسي (يُشغَّل يدويًا أو بمؤقّت سنوي) ---------- */
function purgeBefore(dateStr){var sh=sheet(),v=sh.getDataRange().getValues(),keep=[v[0]];for(var i=1;i<v.length;i++){var d=v[i][1] instanceof Date?Utilities.formatDate(v[i][1],'Asia/Dubai','yyyy-MM-dd'):String(v[i][1]);if(d>=dateStr)keep.push(v[i])}sh.clearContents();sh.getRange(1,1,keep.length,keep[0].length).setValues(keep)}
