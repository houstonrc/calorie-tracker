/* Health Connect / Google Fit sync.
   NATIVE (Android app built with Capacitor + @devmaxime/capacitor-health-connect): real reads from Health Connect, cached in
   localStorage "pj_hc_real".
   WEB (PWA): a browser can't reach Health Connect, so nothing is synced: Settings says "Available in the Android app" and
   Today shows no Health Connect row. Fake data is never shown on the web.
   MOCK (design demos/tests only): on localhost with localStorage pj_hc_demo="1", the simulated data below is used.
   --- original mockup notes ---
   SIMULATED: a web PWA cannot read Health Connect. In the Play Store build (Capacitor Android wrapper) the
   functions marked "REAL PATH" would call a Health Connect plugin, e.g. @capawesome-team/capacitor-health:
   Health.requestPermissions({read:["STEPS","WORKOUT","ACTIVE_CALORIES","WEIGHT"]}), Health.aggregate({dataType:"STEPS",bucket:"day",operations:["sum"]}),
   Health.readWorkouts(...). Here, connect() just flips a flag and hcDay() returns made-up but realistic numbers.
   Mock state lives in localStorage "pj_hc_mock" (not in ct_data_v1), so it never touches real logs. */
(function(){
const $=id=>document.getElementById(id);
const I=d=>`<svg class="lic" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const IC={pulse:"M22 12h-4l-3 9L9 3l-3 9H2",heart:"M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
 steps:"M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0zM20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0z",
 run:"M14 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M5 21l4-6 3 2 1 5M6 11l3-3 4 1 2 4 4 1M9 15l2-7",flame:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",
 scale:"M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8",check:"M20 6L9 17l-5-5",refresh:"M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",link:"M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
 fit:"M12 21s-7-4.4-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9zM7 12h3l1.5-2.5L13 14l1.5-2H17",lock:"M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",x:"M18 6L6 18M6 6l12 12"};
const K="pj_hc_mock";
const st=()=>{try{return JSON.parse(localStorage.getItem(K))||{}}catch(e){return {}}};
const put=s=>{localStorage.setItem(K,JSON.stringify(s));};
const types=()=>Object.assign({steps:1,workouts:1,active:1,weight:1},st().types||{});
const on=()=>!WEB&&!!(st().hc&&st().hc.on);
const TYPES=[["steps","Steps",IC.steps],["workouts","Workouts",IC.run],["active","Active calories",IC.flame],["weight","Weight",IC.scale]];

/* ---- REAL PATH: Health Connect through Capacitor (Android app only) ---- */
const CAP=window.Capacitor,HCP=CAP&&CAP.isNativePlatform&&CAP.isNativePlatform()&&CAP.Plugins&&CAP.Plugins.HealthConnect;
const NATIVE=!!HCP;window.PJ_HC_NATIVE=NATIVE;if(NATIVE)document.documentElement.classList.add("pjnative");
const MOCK=!NATIVE&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&localStorage.getItem("pj_hc_demo")==="1";
const WEB=!NATIVE&&!MOCK;if(WEB)document.documentElement.classList.add("pjhcweb");
const RK="pj_hc_real",rget=()=>{try{return JSON.parse(localStorage.getItem(RK))||{days:{}}}catch(e){return {days:{}}}},rput=x=>localStorage.setItem(RK,JSON.stringify(x));
const READ=["Steps","ExerciseSession","ActiveCaloriesBurned","Weight"];
const APPS={"com.google.android.apps.fitness":"Google Fit","com.sec.android.app.shealth":"Samsung Health","com.fitbit.FitbitMobile":"Fitbit","com.strava":"Strava","com.garmin.android.apps.connectmobile":"Garmin","com.google.android.apps.healthdata":"Health Connect","com.ouraring.oura":"Oura","com.whoop.android":"WHOOP"};
function actOf(t){t=String(t||"").replace("EXERCISE_TYPE_","");if(/RUNNING/.test(t))return "run";if(/WALKING|HIKING/.test(t))return "walk";if(/BIKING|CYCLING/.test(t))return "bike";if(/STRENGTH|WEIGHTLIFTING|CALISTHENICS/.test(t))return "lift";if(/HIGH_INTENSITY|BOOT_CAMP/.test(t))return "hiit";if(/SWIMMING/.test(t))return "swim";if(/BASKETBALL/.test(t))return "bball";return "other";}
const dayStart=k=>{const d=parse(k);d.setHours(0,0,0,0);return d;};
async function nativeConnect(gfit){const a=await HCP.checkAvailability();
 if(a.availability==="NotInstalled"){toast("Install Health Connect from Google Play first");window.open("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata","_system");return false;}
 if(a.availability!=="Available"){toast("Health Connect isn't supported on this phone");return false;}
 const g=await HCP.requestPermissions({read:READ,write:[]});const granted=(g&&g.read)||[];
 if(!granted.length){toast("No access given. You can allow it later in Health Connect settings");return false;}
 const x=st();x.hc={on:true,at:Date.now(),sync:0};if(gfit)x.gfit={on:true};x.granted=granted;put(x);await nativeSync(true);return true;}
async function nativeSync(force){const x=st();if(!x.hc||!x.hc.on)return;if(!force&&x.hc.sync&&Date.now()-x.hc.sync<15*6e4)return;
 const R=rget();const td=ymd(new Date());const s0=dayStart(td);s0.setDate(s0.getDate()-6);const now=new Date();
 const G=new Set(x.granted||READ),iso=d=>new Date(d).toISOString();
 try{
  const days={};for(let i=0;i<7;i++){const d=new Date(s0);d.setDate(s0.getDate()+i);days[ymd(d)]={steps:null,active:null,wk:[]};}
  const bucket=async type=>{const r=await HCP.aggregateRecords({type,start:iso(s0),end:iso(now),groupBy:"day"});(r.aggregates||[]).forEach(b=>{const k=ymd(new Date(b.startTime));if(days[k])days[k][type==="Steps"?"steps":"active"]=Math.round(+b.value||0);});};
  if(G.has("Steps"))await bucket("Steps");if(G.has("ActiveCaloriesBurned"))await bucket("ActiveCaloriesBurned");
  if(G.has("ExerciseSession")){const r=await HCP.readRecords({type:"ExerciseSession",start:iso(s0),end:iso(now)});
   for(const e of (r.records||[]).slice(0,30)){const st0=new Date(e.startTime),en=new Date(e.endTime),k=ymd(st0);if(!days[k])continue;let kcal=0;
    if(G.has("ActiveCaloriesBurned")){try{const a=await HCP.aggregateRecords({type:"ActiveCaloriesBurned",start:iso(st0),end:iso(en),groupBy:"day"});kcal=Math.round((a.aggregates||[]).reduce((t,b)=>t+(+b.value||0),0));}catch(err){}}
    const min=Math.max(1,Math.round((en-st0)/6e4));const act=actOf(e.exerciseType);if(!kcal)kcal=estKcal(act,min,"moderate",kgNow());
    days[k].wk.push({act,min,kcal,app:APPS[e.metadata&&e.metadata.dataOrigin]||"Health Connect"});}}
  if(G.has("Weight")){const s30=new Date(now-30*864e5);const r=await HCP.readRecords({type:"Weight",start:iso(s30),end:iso(now)});const L=(r.records||[]).sort((a,b)=>a.time<b.time?-1:1);if(L.length)R.weightKg=+L[L.length-1].value;}
  Object.assign(R.days,days);R.sync=Date.now();rput(R);x.hc.sync=Date.now();put(x);
 }catch(err){console.warn("Health Connect sync failed",err);toast("Couldn't sync with Health Connect. Try again");}
 try{renderCap();renderToday();}catch(e){}}
async function nativeOff(){try{await HCP.revokePermissions();}catch(e){}localStorage.removeItem(RK);}
if(NATIVE){document.addEventListener("visibilitychange",()=>{if(!document.hidden&&on())nativeSync(false);});setTimeout(()=>{if(on())nativeSync(false);},1500);}


/* ---- SIMULATED daily data (REAL PATH: Health.aggregate per day + Health.readWorkouts) ---- */
function rnd(seed){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return ()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%10000)/10000;};}
function hcDay(k){if(!MOCK||!on())return null;const td=ymd(new Date());if(k>td)return null;const c=st().hc.at?ymd(new Date(st().hc.at-30*864e5)):td;if(k<c)return null;
 if(k===td)return {steps:8412,wk:[{act:"run",min:32,kcal:341,app:"Pixel Watch"}]};
 const r=rnd(k),steps=Math.round(5200+r()*6800),wk=[];const x=r();if(x<.3)wk.push({act:"walk",min:Math.round(25+r()*30),kcal:Math.round(120+r()*90),app:"Google Fit"});else if(x<.5)wk.push({act:"run",min:Math.round(20+r()*20),kcal:Math.round(220+r()*160),app:"Pixel Watch"});
 return {steps,wk};}
const kgNow=()=>{try{return bodyKg()||80}catch(e){return 80}};
const moveKcal=steps=>Math.round(steps*0.04*kgNow()/80); // walking ~0.04 kcal/step at 80 kg
function synced(k){const T=types();
 if(NATIVE){if(!on())return null;const d=rget().days[k];if(!d)return null;const wk=T.workouts?d.wk:[];const wkK=wk.reduce((a,w)=>a+w.kcal,0);
  // Health Connect active calories already include workouts, so only the part outside workouts is added as movement.
  let mv=0;if(T.active&&d.active!=null)mv=Math.max(0,d.active-wkK);else if(T.active&&T.steps&&d.steps)mv=moveKcal(d.steps);
  return {steps:T.steps?d.steps:null,wk,mv,active:T.active?(d.active!=null?Math.max(d.active,wkK):mv+wkK):null};}
 const d=hcDay(k);if(!d)return null;const wk=T.workouts?d.wk:[];const wkK=wk.reduce((a,w)=>a+w.kcal,0);
 const mv=T.active&&T.steps?moveKcal(d.steps):0;return {steps:T.steps?d.steps:null,wk,mv,active:T.active?mv+wkK:null};}
window.pjSynced=synced;

/* ---- feed the existing burn / workout math ---- */
const _wl=wkList;wkList=window.wkList=function(k=cur){const L=_wl(k);const s=synced(k);if(!s||!s.wk.length)return L;
 return L.concat(s.wk.map((w,i)=>({id:"hc-"+k+"-"+i,act:w.act,min:w.min,int:"",kcal:w.kcal,manual:true,src:"hc",app:w.app})));};
const _bo=burnOf;burnOf=window.burnOf=function(k=cur){const s=synced(k);return _bo(k)+(s?s.mv:0);};
const _bk=bodyKg;bodyKg=window.bodyKg=function(){const v=_bk();if(v)return v;if(!(on()&&types().weight))return 0;if(NATIVE)return rget().weightKg||0;return MOCK?184.6*0.4536:0;};

/* ---- Today: synced row inside the Activity card ---- */
const ago=()=>{const t=st().hc&&st().hc.sync;if(!t)return "just now";const m=Math.round((Date.now()-t)/6e4);return m<1?"just now":m<60?m+" min ago":Math.round(m/60)+" h ago";};
const _rb=renderBurnCard;renderBurnCard=window.renderBurnCard=function(){_rb.apply(this,arguments);const el=$("burnCard");if(!el||WEB)return;
 el.querySelectorAll('[data-wid^="hc-"]').forEach(r=>{const b=r.querySelector(".wdel");if(b)b.outerHTML=`<span class="hctag">${I(IC.link)}Synced</span>`;});
 const s=synced(cur),box=document.createElement("div");box.id="hcRow";
 if(on()&&s){const sp=s.steps||0,pct=Math.min(100,sp/100);
  box.className="hcrow";box.innerHTML=`<div class="hch"><span class="hci">${I(IC.pulse)}</span><span class="hcht"><b>Synced from Health Connect</b><small>Updated ${ago()}</small></span><em class="pvtag">Preview</em><button type="button" class="ghost hcre" aria-label="Sync now">${I(IC.refresh)}</button></div>
  <div class="hcg"><div><b>${s.steps!=null?sp.toLocaleString():"–"}</b><span>Steps</span></div><div><b>${s.active!=null?s.active.toLocaleString():"–"}</b><span>Active cal</span></div><div><b>${s.wk.length}</b><span>Workout${s.wk.length==1?"":"s"}</span></div></div>
  <div class="hcbar"><i style="width:${pct}%"></i></div><p class="hcn">${s.steps!=null?`${Math.round(pct)}% of 10,000 steps · `:""}${s.mv?`+${s.mv} from steps`:""}${s.mv&&s.wk.length?" and ":""}${s.wk.map(w=>`+${w.kcal} ${(ACT[w.act]||ACT.other)[1]}`).join(", ")} counted in Burned</p>`;
  box.querySelector(".hcre").onclick=()=>{if(NATIVE){nativeSync(true).then(()=>toast("Synced with Health Connect"));return;}const x=st();x.hc.sync=Date.now();put(x);renderToday();toast("Synced with Health Connect");};}
 else{box.className="hcrow off";box.innerHTML=`<span class="hci">${I(IC.pulse)}</span><div class="hco"><b>Sync steps and workouts</b><small>Health Connect or Google Fit fills in Burned for you</small></div><button type="button" class="small" id="hcGo">Connect</button>`;
  box.querySelector("#hcGo").onclick=()=>openPerm("hc");}
 const anchor=el.querySelector(".bhd");if(anchor)anchor.after(box);else el.prepend(box);};

/* ---- Settings: Connected apps card (on the main Settings page, always visible) ---- */
const syncedLb=()=>{const kg=NATIVE?rget().weightKg:MOCK?184.6*0.4536:0;return kg?(Math.round(kg/0.4536*10)/10):0;};
function renderCap(){let c=$("capCard");if(!c){const L=$("sList");if(!L)return;c=document.createElement("div");c.className="card";c.id="capCard";L.after(c);}
 if(WEB){const wr=(name,sub,icon)=>`<div class="caprow"><span class="capic">${I(icon)}</span><span class="rl"><b>${name}</b><small>${sub}</small></span><span class="capand">Coming soon</span></div>`;
  c.innerHTML=`<div class="caph"><span class="capt">Connected apps</span></div><p class="capp">Health Connect sync is coming soon in the PlateJack Android app. It will bring in steps, workouts, active calories and weight so Burned updates by itself. A browser can't read Health Connect, so on the web you log workouts yourself.</p><p class="capsoon">Coming soon in the Android app</p>
  ${wr("Health Connect","Android · phone, watch and fitness apps",IC.heart)}${wr("Google Fit","Shares its data through Health Connect",IC.fit)}
  <p class="fine capf">${I(IC.lock)}Read-only. PlateJack never writes to Health Connect and never uses health data for ads.</p>`;return;}
 const s=st(),hc=on(),gf=!!(s.gfit&&s.gfit.on),T=types();
 const row=(id,name,sub,icon,isOn,note)=>`<div class="caprow"><span class="capic">${I(icon)}</span><span class="rl"><b>${name}</b><small>${sub}</small>${isOn&&note?`<small class="capok">${I(IC.check)}${note}</small>`:""}</span>${isOn?`<span class="cappill">${I(IC.check)}Connected</span>`:`<button type="button" class="small" data-con="${id}">Connect</button>`}</div>`;
 c.innerHTML=`<div class="caph"><span class="capt">Connected apps</span><em class="pvtag">Preview</em></div><p class="capp">Bring in steps, workouts, active calories and weight so Burned and your workout ring update by themselves.</p>
 ${row("hc","Health Connect","Android · phone, watch and fitness apps",IC.heart,hc,`Last sync ${ago()}`)}
 ${row("gfit","Google Fit","Shares its data through Health Connect",IC.fit,gf,"Coming in through Health Connect")}
 <div class="capws">What syncs</div><div class="capgrid">${TYPES.map(([k,n,ic])=>`<button type="button" class="captog${T[k]?" on":""}${hc?"":" dim"}" data-t="${k}">${I(ic)}<span>${n}</span><i>${T[k]?I(IC.check):""}</i></button>`).join("")}</div>
 ${hc&&T.weight&&syncedLb()?`<p class="capw">${I(IC.scale)}<span>Latest synced weight <b>${syncedLb()} lb</b>. Used for workout estimates when you haven't logged one.</span></p>`:""}
 ${hc?`<div class="capact"><button type="button" class="ghost" id="capSync">${I(IC.refresh)}Sync now</button><button type="button" class="ghost" id="capOff">Disconnect</button></div>`:""}
 <p class="fine capf">${I(IC.lock)}Read-only. PlateJack never writes to Health Connect and never uses health data for ads. You can turn it off any time.</p>`;
 c.querySelectorAll("[data-con]").forEach(b=>b.onclick=()=>openPerm(b.dataset.con));
 c.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{const x=st();x.types=Object.assign(types(),{[b.dataset.t]:types()[b.dataset.t]?0:1});put(x);renderCap();renderToday();});
 const sy=$("capSync");if(sy)sy.onclick=()=>{if(NATIVE){nativeSync(true).then(()=>toast("Synced with Health Connect"));return;}const x=st();x.hc.sync=Date.now();put(x);renderCap();renderToday();toast("Synced with Health Connect");};
 const of=$("capOff");if(of)of.onclick=async()=>{if(NATIVE)await nativeOff();const x=st();x.hc={on:false};x.gfit={on:false};put(x);renderCap();renderToday();toast("Disconnected. Synced activity removed from Burned");};}

/* ---- Connect sheet (REAL PATH: Health.isAvailable() -> Health.requestPermissions(...) shows Android's own screen) ---- */
document.body.insertAdjacentHTML("beforeend",`<dialog id="hcPerm"><div class="hcpi">${I(IC.heart)}</div><h2 id="hcpT">Connect Health Connect</h2><p id="hcpP"></p>
 <div class="hcpl">${TYPES.map(([k,n,ic])=>`<div>${I(ic)}<span>${n}</span><small>${{steps:"Daily step count",workouts:"Runs, rides, lifts and more",active:"Calories burned moving",weight:"Your latest weigh-ins"}[k]}</small></div>`).join("")}</div>
 <p class="fine" style="text-align:left;margin:8px 0 0">Next, Android shows its Health Connect screen where you allow each one.</p>
 <button type="button" id="hcpGo">Continue</button><button type="button" class="ghost" id="hcpX">Not now</button></dialog>`);
let pend="hc";
function openPerm(which){if(WEB){toast("Coming soon in the Android app");return;}pend=which;$("hcpT").textContent=which==="gfit"?"Connect Google Fit":"Connect Health Connect";
 $("hcpP").textContent=which==="gfit"?"Google Fit sends its steps and workouts to Health Connect, so PlateJack reads them from there. PlateJack will read:":"PlateJack will read these from Health Connect, so your phone, watch and other fitness apps fill in Burned for you:";
 $("hcpGo").disabled=false;$("hcpGo").textContent="Continue";$("hcPerm").showModal();}
$("hcpX").onclick=()=>$("hcPerm").close();
$("hcpGo").onclick=()=>{const b=$("hcpGo");b.disabled=true;b.textContent="Connecting…";
 if(NATIVE){nativeConnect(pend==="gfit").then(ok=>{$("hcPerm").close();renderCap();renderToday();if(ok)toast("Health Connect connected");}).catch(e=>{console.warn(e);$("hcPerm").close();toast("Couldn't connect to Health Connect");});return;}
 setTimeout(()=>{const x=st();x.hc={on:true,at:Date.now(),sync:Date.now()};if(pend==="gfit")x.gfit={on:true};put(x);$("hcPerm").close();renderCap();renderToday();
  toast(pend==="gfit"?"Google Fit connected through Health Connect":"Health Connect connected · last 30 days synced");},1100);};

document.head.insertAdjacentHTML("beforeend",`<style id="hcsync">
.hcrow{margin:12px 0 4px;padding:12px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(var(--accrgb),.35)}
.hcrow .lic{width:16px;height:16px;flex:none}
.hch{display:flex;align-items:center;gap:8px}.hcht{flex:1;display:flex;flex-direction:column;min-width:0}.hch b{font-size:.7rem;letter-spacing:.07em;text-transform:uppercase;color:var(--acc-hi);font-weight:800;white-space:nowrap}.hch small{color:var(--muted);font-size:.68rem}.hch .pvtag{margin-left:0}
.hci{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:rgba(var(--accrgb),.14);border:1px solid rgba(var(--accrgb),.35);color:var(--acc);flex:none}
.hcre{width:28px;height:28px;min-height:0!important;padding:0!important;display:grid;place-items:center;border-radius:9px!important}.hcre .lic{width:14px!important;height:14px!important}
.hcg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 8px}.hcg div{display:flex;flex-direction:column;align-items:center;padding:8px 4px;border-radius:12px;background:rgba(0,0,0,.18)}
.hcg b{font-family:"PJ Cond","Bahnschrift","Oswald",sans-serif;font-weight:650;font-size:1.3rem;font-variant-numeric:tabular-nums}.hcg span{font-size:.66rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.hcbar{height:5px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden}.hcbar i{display:block;height:100%;background:var(--acc);border-radius:9px}
.hcn{margin:7px 0 0;font-size:.72rem;color:var(--muted);line-height:1.35}
.hcrow.off{display:flex;align-items:center;gap:10px;border-style:dashed}.hco{flex:1;display:flex;flex-direction:column;min-width:0}.hco b{font-size:.86rem}.hco small{font-size:.72rem;color:var(--muted)}
.hctag{display:inline-flex;align-items:center;gap:4px;font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--acc-hi);padding:4px 7px;border-radius:8px;border:1px solid rgba(var(--accrgb),.4);flex:none}.hctag .lic{width:11px;height:11px}
#capCard{padding:14px}#capCard .lic{width:16px;height:16px;flex:none}
.caph{display:flex;align-items:center;gap:4px}.capt{font-family:"PJ Cond","Bahnschrift","Oswald",sans-serif;font-weight:650;text-transform:uppercase;letter-spacing:.05em;font-size:1rem}
.capp{margin:4px 0 8px;color:var(--muted);font-size:.78rem;line-height:1.4}
.caprow{display:flex;align-items:center;gap:12px;padding:10px 2px;border-top:1px solid rgba(170,185,200,.12)}.caprow .rl{flex:1;display:flex;flex-direction:column;min-width:0}.caprow b{font-size:.9rem}.caprow small{font-size:.72rem;color:var(--muted);line-height:1.3}
.capic{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(var(--accrgb),.12);border:1px solid rgba(var(--accrgb),.3);color:var(--acc);flex:none}.capic .lic{width:20px!important;height:20px!important}
.capok{display:flex;align-items:center;gap:4px;color:var(--acc-hi)!important;margin-top:2px}.capok .lic{width:12px!important;height:12px!important}
.cappill{display:inline-flex;align-items:center;gap:4px;padding:6px 9px;border-radius:99px;font-size:.7rem;font-weight:800;color:#fff;background:var(--grad);flex:none}.cappill .lic{width:12px!important;height:12px!important}
.capws{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:800;margin:10px 2px 6px}
.capgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.captog{display:flex;align-items:center;gap:8px;padding:9px 10px!important;min-height:0!important;border-radius:12px!important;text-align:left;font-size:.78rem!important;font-weight:700;background:rgba(255,255,255,.04)!important;border:1px solid rgba(170,185,200,.18)!important;color:var(--text)!important;box-shadow:none!important}
.captog span{flex:1}.captog>.lic{color:var(--acc-hi)}.captog i{width:16px;height:16px;border-radius:5px;border:1.5px solid rgba(170,185,200,.4);display:grid;place-items:center}.captog.on i{background:var(--acc);border-color:var(--acc);color:#fff}.captog i .lic{width:11px!important;height:11px!important;stroke-width:3}
.captog.dim{opacity:.6}
.capw{display:flex;align-items:center;gap:6px;font-size:.74rem;color:var(--muted);margin:10px 2px 0;line-height:1.35}.capw b{color:var(--text)}.capw .lic{color:var(--acc-hi)}
.capact{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.capact button{display:flex;align-items:center;justify-content:center;gap:6px}
.capf{display:flex;align-items:flex-start;gap:6px;text-align:left!important;margin:10px 2px 0!important}.capf .lic{width:13px!important;height:13px!important;margin-top:1px}
#hcPerm{max-width:360px;padding:20px 18px 16px;border-radius:20px}#hcPerm h2{text-align:center;margin:8px 0 6px;font-size:1.1rem}#hcPerm>p{color:var(--muted);font-size:.84rem;line-height:1.45;margin:0 0 10px;text-align:center}
.hcpi{width:48px;height:48px;margin:0 auto;border-radius:50%;display:grid;place-items:center;background:rgba(var(--accrgb),.14);color:var(--acc);border:1px solid rgba(var(--accrgb),.35)}.hcpi .lic{width:22px;height:22px}
.hcpl{display:grid;gap:6px}.hcpl div{display:grid;grid-template-columns:20px 1fr;column-gap:10px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(170,185,200,.14)}.hcpl .lic{grid-row:span 2;width:18px;height:18px;color:var(--acc-hi)}.hcpl span{font-weight:700;font-size:.84rem}.hcpl small{color:var(--muted);font-size:.72rem}
#hcPerm button{width:100%;margin-top:8px}
html.pjnative #hcRow .pvtag,html.pjnative #capCard .pvtag{display:none}
.capsoon{margin:0 0 6px;font-size:.74rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--acc-hi)}
.capand{font-size:.68rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);padding:5px 8px;border-radius:8px;border:1px solid rgba(170,185,200,.25);flex:none;white-space:nowrap}
</style>`);
setTimeout(()=>{renderCap();renderToday();},60);
const _ss=window.showTab;window.showTab=showTab=function(t){_ss.apply(this,arguments);if(t==="settings")renderCap();};
})();
