/* Android app (Capacitor) helpers: phone notifications through @capacitor/local-notifications and
   auth email deep links (com.platejack.app://auth-callback) through @capacitor/app.
   On the website every helper here is a no-op and the web code paths run unchanged. */
(function(){
const C=window.Capacitor;
const native=!!(C&&C.isNativePlatform&&C.isNativePlatform());
const plug=n=>(native&&C.Plugins&&C.Plugins[n])||null;
const LN=()=>plug("LocalNotifications");
const CH="pj-reminders";
let perm=native&&LN()?"default":"unsupported",chReady=false;
// Stable positive 31-bit id from a string key (Android notification ids are ints).
function nid(k){let h=7;k=String(k);for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))|0;return (Math.abs(h)%2000000000)+1;}
const mapPerm=d=>d==="granted"?"granted":d==="denied"?"denied":"default";
async function refreshPerm(){const L=LN();if(!L)return perm="unsupported";try{const r=await L.checkPermissions();perm=mapPerm(r&&r.display);}catch(e){perm="unsupported";}return perm;}
// Android 13+ shows the system prompt; older versions report granted unless notifications are off in settings.
async function requestPerm(){const L=LN();if(!L)return perm="unsupported";try{await refreshPerm();if(perm==="granted")return perm;const r=await L.requestPermissions();perm=mapPerm(r&&r.display);}catch(e){perm="unsupported";}return perm;}
async function channel(){const L=LN();if(!L||chReady)return;try{await L.createChannel({id:CH,name:"Reminders",description:"Meal, water, workout and coach reminders",importance:4,visibility:1,vibration:true});}catch(e){}chReady=true;}
// list: [{key,title,body,at:Date|null,act,type}]; at null means show now.
async function schedule(list){const L=LN();if(!L||perm!=="granted"||!list.length)return false;await channel();
 const n=list.map(m=>{const o={id:nid(m.key),title:m.title,body:m.body,channelId:CH,smallIcon:"ic_stat_platejack",iconColor:"#F47B20",autoCancel:true,extra:{act:m.act||"today",key:m.key,type:m.type||""}};
  if(m.at)o.schedule={at:new Date(m.at),allowWhileIdle:true}; // no schedule = shown right away (not an alarm, so a resync can't cancel it)
  return o;});
 try{await L.schedule({notifications:n});return true;}catch(e){console.warn("notif schedule",e);return false;}}
async function cancelAll(){const L=LN();if(!L)return;try{const p=await L.getPending();const ids=((p&&p.notifications)||[]).map(x=>({id:+x.id}));if(ids.length)await L.cancel({notifications:ids});}catch(e){}}
function onTap(cb){const L=LN();if(!L)return;try{L.addListener("localNotificationActionPerformed",ev=>{try{const ex=(ev&&ev.notification&&ev.notification.extra)||{};cb(ex.act||"today");}catch(e){}});}catch(e){}}
// Auth deep links
const AUTH_CB="com.platejack.app://auth-callback";
/* getLaunchUrl() keeps returning the link that opened the app for as long as the activity lives, even after
   the WebView reloads (sign-out, account deletion). Remember handled links in window.name (survives reloads and
   localStorage.clear()) and localStorage (survives the app being restarted from recents) so a link runs once. */
function marks(){const m=new Set();try{(/(?:^|;)pjAuth=([\d,]*)/.exec(window.name)||[,""])[1].split(",").forEach(x=>x&&m.add(x));}catch(e){}try{(localStorage.getItem("pj_auth_links")||"").split(",").forEach(x=>x&&m.add(x));}catch(e){}return m;}
function mark(h){const m=[...marks(),h].slice(-10).join(",");try{window.name=(window.name||"").replace(/(?:^|;)pjAuth=[\d,]*/,"")+";pjAuth="+m;}catch(e){}try{localStorage.setItem("pj_auth_links",m);}catch(e){}}
function onAuthUrl(cb){const A=plug("App");if(!A)return;const go=u=>{if(!u||u.indexOf(AUTH_CB)!==0)return;const h=String(nid(u));if(marks().has(h))return;mark(h);cb(u);};
 try{A.addListener("appUrlOpen",ev=>go(ev&&ev.url));}catch(e){}
 try{Promise.resolve(A.getLaunchUrl()).then(r=>go(r&&r.url)).catch(()=>{});}catch(e){}}
window.PJN={native,nid,get perm(){return perm;},refreshPerm,requestPerm,schedule,cancelAll,onTap,AUTH_CB,onAuthUrl,hasNotif:()=>!!LN()};
if(native&&LN())refreshPerm();
})();
