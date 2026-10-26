/* Snap a plate: photo -> detected foods with editable portions -> Log all.
   Recognition: PJVision.recognize() calls the Supabase Edge Function "recognize-plate" (Gemini vision + USDA nutrition).
   Needs a signed-in user (3 free scans a day, Pro unlimited). On ANY error (signed out, limit, offline, function not deployed)
   the app falls back to the manual "pick the foods yourself" snap with the photo kept.
   mode "simulated" keeps the old offline sample results for demos/tests (see simulate()). */
(function(){
const $=id=>document.getElementById(id);
const I=d=>`<svg class="lic" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const IC={cam:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
 img:"M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M21 15l-5-5L5 21",x:"M18 6L6 18M6 6l12 12",plus:"M12 5v14M5 12h14",minus:"M5 12h14",
 sun:"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2",up:"M12 19V5M5 12l7-7 7 7",frame:"M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5",
 list:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",check:"M20 6L9 17l-5-5",refresh:"M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
 alert:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01"};
window.PJ_IC=Object.assign(window.PJ_IC||{},IC);
const SAMPLE="img/r/teri-d.webp"; // bundled recipe photo (teriyaki chicken bowl, credited in CREDITS.md)

/* ---------- recognizer adapter ---------- */
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
class VisionError extends Error{constructor(code,msg,extra){super(msg||code);this.code=code;Object.assign(this,extra||{});}}
const PJVision=window.PJVision={
 mode:"edge", // "edge" = real (Supabase function) | "simulated" = offline sample results
 endpoint(){const o=LOCAL&&localStorage.getItem("pj_vision_endpoint");return o||((typeof SB_URL!=="undefined"?SB_URL:"")+"/functions/v1/recognize-plate");},
 async token(){try{if(typeof sb!=="undefined"&&sb){const s=(await sb.auth.getSession()).data.session;if(s)return s.access_token;}}catch(e){}
  return LOCAL&&localStorage.getItem("pj_vision_endpoint")?"dev-local":null;}, // dev token only works against the local test server
 async recognize(file,hint){
  if(this.mode!=="edge"||hint==="sample")return simulate(hint); // sample plate is always the free canned demo
  if(!navigator.onLine)throw new VisionError("offline","You're offline.");
  const tok=await this.token();if(!tok)throw new VisionError("auth","Sign in to use Snap a plate.");
  const image=await toJpegB64(file,1024);const ac=new AbortController(),t=setTimeout(()=>ac.abort(),35000);
  let r;try{r=await fetch(this.endpoint(),{method:"POST",signal:ac.signal,headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok,...(typeof SB_KEY!=="undefined"?{apikey:SB_KEY}:{})},body:JSON.stringify({image,mime:"image/jpeg"})});}
  catch(e){throw new VisionError("network",e.name==="AbortError"?"That took too long.":"Couldn't reach PlateJack.");}finally{clearTimeout(t);}
  let j={};try{j=await r.json();}catch(e){}
  if(!r.ok)throw new VisionError(j.error||("http"+r.status),j.message,{used:j.used,limit:j.limit});
  if(!Array.isArray(j.items))throw new VisionError("bad_response");
  this.last={used:j.used,limit:j.limit,pro:j.pro};return j.items;
 }};
function toJpegB64(file,max){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.8).split(",")[1]);};im.onerror=rej;im.src=typeof file==="string"?file:URL.createObjectURL(file);});}

/* SIMULATED RECOGNITION (mockup only). Values are typical USDA numbers per unit; boxes are % of the photo.
   Item shape: {name, unit, qty, step, per:{cal,p,c,f} (per 1 unit), conf:0-1, at:[x%,y%], note?} */
const SIM={
 sample:[ // canned results for the bundled sample photo (img/r/teri-d.webp): free, no scan, no server call
  {name:"Grilled teriyaki chicken",unit:"oz",qty:6,step:1,per:{cal:46,p:6.5,c:1.5,f:1.6},conf:.93,at:[60,58]},
  {name:"Steamed broccoli",unit:"cup",qty:.75,step:.25,per:{cal:35,p:2.4,c:7,f:.4},conf:.95,at:[27,64]},
  {name:"Carrots and asparagus",unit:"cup",qty:.75,step:.25,per:{cal:57,p:2.7,c:11,f:.6},conf:.86,at:[28,30]},
  {name:"White rice",unit:"cup",qty:1,step:.25,per:{cal:205,p:4.3,c:45,f:.4},conf:.52,at:[48,82],note:"Might be under the chicken. Check the amount."},
  {name:"Teriyaki sauce",unit:"tbsp",qty:1.5,step:.5,per:{cal:14,p:1,c:2.6,f:0},conf:.7,at:[73,40]}],
 photo:[ // shown for the user's own photo in the mockup, since nothing is really analyzed
  {name:"Grilled chicken breast",unit:"oz",qty:5,step:1,per:{cal:47,p:8.8,c:0,f:1},conf:.9,at:[55,50]},
  {name:"Brown rice",unit:"cup",qty:1,step:.25,per:{cal:218,p:4.5,c:46,f:1.6},conf:.82,at:[30,62]},
  {name:"Mixed vegetables",unit:"cup",qty:1,step:.5,per:{cal:60,p:3,c:12,f:.4},conf:.74,at:[70,30]},
  {name:"Olive oil (cooking)",unit:"tsp",qty:1,step:1,per:{cal:40,p:0,c:0,f:4.5},conf:.5,at:[50,80],note:"Oil is hard to see. Add more if it was cooked in a lot."}]};
function simulate(hint){return new Promise(r=>setTimeout(()=>r(JSON.parse(JSON.stringify(SIM[hint]||SIM.photo))),2600));}

/* ---------- UI ---------- */
const st={step:"pick",img:null,items:[],meal:null,hint:"photo",busy:0};
document.body.insertAdjacentHTML("beforeend",`<dialog id="psnap" class="tall"><div class="shd" tabindex="-1" autofocus style="outline:none"><h2><span class="pshic">${I(IC.cam)}</span>Snap a plate <em class="pvtag psv">Preview</em></h2><button type="button" class="ghost small" id="psClose">Cancel</button></div><div id="psBody"></div>
<input type="file" accept="image/*" capture="environment" id="psCam" hidden><input type="file" accept="image/*" id="psLib" hidden></dialog>`);
const D=$("psnap"),B=$("psBody");
const r1=n=>Math.round(n*10)/10,fq=q=>{const x=Math.round(q*4)/4,w=Math.floor(x),f=x-w;const fr=f===.25?"¼":f===.5?"½":f===.75?"¾":"";return w&&fr?w+" "+fr:w?String(w):fr||"0"};
const qtyTxt=it=>it.unit==="oz"||it.unit==="tbsp"||it.unit==="tsp"?`${r1(it.qty)} ${it.unit}`:`${fq(it.qty)} ${it.unit}`;
const kc=it=>Math.round(it.per.cal*it.qty),pr=it=>r1(it.per.p*it.qty);
const tot=()=>st.items.reduce((a,it)=>({cal:a.cal+kc(it),p:a.p+it.per.p*it.qty}),{cal:0,p:0});
const MEALS=["Breakfast","Lunch","Dinner","Snacks"];
function open(){st.step="pick";st.img=null;st.items=[];st.meal=null;draw();if(!D.open)D.showModal();}
window.openSnapPlate=open;
function pickMeal(){if(st.meal)return st.meal;try{return defaultMeal()}catch(e){return "Lunch"}}
function draw(){D.dataset.step=st.step;
 if(st.step==="pick"){B.innerHTML=`<div class="psdrop"><div class="psdi">${I(IC.cam)}</div><b>Take a photo of your plate</b><small>PlateJack finds the foods, portions, calories and protein. You check them, then log it all in one tap.</small>
  <div class="psbtns"><button type="button" id="psTake">${I(IC.cam)}Take photo</button><button type="button" class="ghost" id="psPick">${I(IC.img)}Choose photo</button></div></div>
  <button type="button" class="pssample" id="psSample"><img src="${SAMPLE}" alt=""><span><b>Try a sample plate</b><small>Teriyaki chicken bowl · free demo, no scan used</small></span><i>${I(IC.up)}</i></button>
  ${PJVision.last&&PJVision.last.limit?`<p class="psleft">${Math.max(0,PJVision.last.limit-PJVision.last.used)} of ${PJVision.last.limit} free scans left today</p>`:""}<div class="pstips"><span>${I(IC.frame)}Whole plate in frame</span><span>${I(IC.sun)}Good light</span><span>${I(IC.up)}Shoot from above</span></div>${PJVision.mode==="edge"?`<p class="psprv">Your photo goes to Google's Gemini AI to identify the food. PlateJack doesn't store it. On Gemini's free tier, Google may use it to improve its products. <a href="privacy.html#camera" target="_blank" rel="noopener">Privacy</a></p>`:""}
  <button type="button" class="link psman" id="psManual">${I(IC.list)}Pick the foods myself instead</button>`;
  $("psTake").onclick=()=>$("psCam").click();$("psPick").onclick=()=>$("psLib").click();
  $("psSample").onclick=()=>run(SAMPLE,"sample");
  $("psManual").onclick=()=>{D.close();try{$("snapBtn")._orig?$("snapBtn")._orig():openSnap()}catch(e){}};return;}
 if(st.step==="scan"){B.innerHTML=`<div class="psph scanning"><img src="${st.img}" alt="Your plate"><i class="psline"></i><i class="pscor"></i></div>
  <div class="psstat"><b id="psMsg">Finding foods…</b><div class="psbar"><i></i></div><small>Usually takes 5 to 10 seconds</small></div>`;
  const M=["Finding foods…","Estimating portions…","Matching nutrition…","Almost there…"];let k=0;clearInterval(st.t);st.t=setInterval(()=>{const m=$("psMsg");if(!m||st.step!=="scan"){clearInterval(st.t);return;}k=Math.min(k+1,M.length-1);m.textContent=M[k];},2200);return;}
 if(st.step==="results"){const t=tot(),meal=pickMeal();
  B.innerHTML=`<div class="psph res"><img src="${st.img}" alt="Your plate">${st.items.map((it,i)=>it.at?`<span class="psdot${it.conf<.6?" low":""}" style="left:${it.at[0]}%;top:${it.at[1]}%">${i+1}</span>`:"").join("")}<button type="button" class="psretake" id="psRetake">${I(IC.refresh)}Retake</button></div>
  ${st.hint==="sample"?`<p class="pssamp">${I(IC.up)}This is a demo using the sample photo. No scan used. Take or choose your own photo to scan your plate.</p>`:""}<div class="pshead"><div><b>${st.hint==="sample"?"Sample plate":"Found "+st.items.length+" item"+(st.items.length==1?"":"s")}</b><small>${st.hint==="sample"?"Example results for this sample photo":"Tap − or + to fix any portion"}</small></div><div class="pstot"><b>${t.cal.toLocaleString()}</b><small>cal</small><b>${Math.round(t.p)}g</b><small>protein</small></div></div>
  <div class="psitems">${st.items.map((it,i)=>`<div class="psit${it.conf<.6?" low":""}" data-i="${i}"><span class="psn">${i+1}</span><div class="psnm"><b>${esc(it.name)}</b>${it.conf<.6?`<small class="pschk">${I(IC.alert)}${esc(it.note||"Not sure about this one. Check it.")}</small>`:`<small>${kc(it)} cal · ${pr(it)}g protein</small>`}${it.conf<.6?`<small>${kc(it)} cal · ${pr(it)}g protein</small>`:""}</div>
   <div class="psq"><button type="button" class="ghost" data-d="-1" aria-label="Less">${I(IC.minus)}</button><span>${qtyTxt(it)}</span><button type="button" class="ghost" data-d="1" aria-label="More">${I(IC.plus)}</button></div><button type="button" class="ghost psx" data-x="1" aria-label="Remove">${I(IC.x)}</button></div>`).join("")}</div>
  <div class="psadd"><span>${I(IC.search)}</span><input id="psAddQ" placeholder="Add something it missed" autocomplete="off"></div><div id="psAddL" class="psaddl"></div>
  <label>Log to</label><div class="chips" id="psMeal">${MEALS.map(m=>`<button type="button" class="${m===meal?"on":""}" data-m="${m}">${m}</button>`).join("")}</div>
  <button type="button" id="psLog" class="pslog"${st.items.length?"":" disabled"}>${I(IC.check)}Log all ${st.items.length} to ${meal} · ${t.cal.toLocaleString()} cal</button>
  <p class="fine">Calories are estimates from the photo. Adjust anything that looks off. Not medical advice.</p>`;
  B.querySelectorAll(".psit").forEach(row=>{const i=+row.dataset.i;row.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const it=st.items[i];it.qty=Math.max(it.step,Math.round((it.qty+it.step*(+b.dataset.d))*100)/100);draw();});
   row.querySelector("[data-x]").onclick=()=>{st.items.splice(i,1);draw();};});
  $("psMeal").onclick=e=>{const b=e.target.closest("[data-m]");if(b){st.meal=b.dataset.m;draw();}};
  $("psRetake").onclick=()=>{st.step="pick";draw();};
  $("psAddQ").oninput=e=>addSearch(e.target.value);
  $("psLog").onclick=logAll;}}
function addSearch(q){const L=$("psAddL");q=q.trim().toLowerCase();if(q.length<2){L.innerHTML="";return;}
 let all=[];try{const rc=recentFoods().map(f=>({...f,serving:f.serving||"1 serving"}));all=rc.concat(FOODS.map(f=>({name:f[0],serving:f[1],cal:f[2],p:f[3],c:f[4],f:f[5]})));}catch(e){}const terms=q.split(/\s+/);const hits=all.filter(f=>terms.every(t=>f.name.toLowerCase().includes(t))).slice(0,5);
 L.innerHTML=hits.length?hits.map((f,i)=>`<button type="button" data-a="${i}"><b>${esc(f.name)}</b><small>${Math.round(f.cal)} cal · ${esc(f.serving||"1 serving")}</small></button>`).join(""):`<div class="muted">No match. Try another word.</div>`;
 L.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const f=hits[+b.dataset.a];st.items.push({name:f.name,unit:"serving",qty:1,step:.5,per:{cal:+f.cal||0,p:+f.p||0,c:+f.c||0,f:+f.f||0},conf:1,at:null,src:"search"});draw();});}
async function run(img,hint){st.hint=hint;st.img=img;st.step="scan";draw();
 try{const items=await PJVision.recognize(img,hint);if(!D.open||st.step!=="scan")return;
  if(!items.length){fallback(img,"No food found in that photo. Pick it yourself.");return;}
  st.items=items;st.step="results";draw();}
 catch(e){if(!D.open||st.step!=="scan")return;console.warn("Snap a plate:",e.code||e.message);
  const msg=e.code==="limit"?(e.message||"You've used today's free scans.")+" Pick foods yourself for now.":e.code==="auth"?"Sign in to use Snap a plate. Pick foods yourself for now.":e.code==="offline"?"You're offline. Pick foods yourself for now.":"Couldn't read that photo. Pick foods yourself.";
  fallback(img,msg,e.code);}}
// Fallback: the original manual Snap & log, keeping the photo as its thumbnail.
async function fallback(img,msg,code){D.close();try{openSnap();}catch(e){return toast(msg);}toast(msg);
 try{const th=await toJpegB64(img,200);const u="data:image/jpeg;base64,"+th;snapThumb=u;$("snapImg").src=u;$("snapBox").classList.add("has");}catch(e){}
 if(code==="limit"){const n=$("snapNoteLimit")||document.createElement("p");n.id="snapNoteLimit";n.className="fine";n.style.textAlign="left";n.innerHTML='Free plan: 3 photo scans a day. <a href="#" id="snapGoPro">More scans are coming with Pro</a>.';$("snapBox").before(n);$("snapGoPro").onclick=ev=>{ev.preventDefault();$("snap").close();try{openPay("snap")}catch(x){}};}
 else{const n=$("snapNoteLimit");if(n)n.remove();}}
function onFile(e){const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;const rd=new FileReader();rd.onload=()=>run(rd.result,"photo");rd.readAsDataURL(f);}
$("psCam").onchange=onFile;$("psLib").onchange=onFile;
function logAll(){const meal=pickMeal(),t=tot(),n=st.items.length;if(!n)return;
 st.items.forEach(it=>addEntry({name:`${it.name} (${qtyTxt(it)})`,cal:kc(it),p:pr(it),c:r1(it.per.c*it.qty),f:r1(it.per.f*it.qty),qty:1,meal,src:"snap"}));
 D.close();try{showTab("today")}catch(e){}toast(`Logged ${n} item${n==1?"":"s"} to ${meal} · ${t.cal.toLocaleString()} cal`);
 setTimeout(()=>{const M=$("meals");if(!M)return;const card=[...M.children].find(c=>{const b=c.querySelector("b");return b&&b.textContent.trim()===meal;});
  const y=M.getBoundingClientRect().top+scrollY-120;scrollTo({top:y});if(card){M.scrollLeft=card.offsetLeft-M.offsetLeft-12;card.classList.add("psflash");setTimeout(()=>card.classList.remove("psflash"),2400);}},350);}
$("psClose").onclick=()=>{st.step="pick";D.close();};
D.addEventListener("close",()=>{clearInterval(st.t);});

/* ---------- entry points (all visible right away) ---------- */
// Today "Snap" link and + menu Scan > Photo open the new flow; the old manual snap stays reachable inside it.
const sb0=$("snapBtn");if(sb0){sb0._orig=sb0.onclick||(()=>{try{openSnap()}catch(e){}});sb0.onclick=open;}
function menu(){const g=document.querySelector("#lmMenu .lmgrid");if(!g)return setTimeout(menu,150);if($("lmSnapPlate"))return;
 const b=document.createElement("button");b.id="lmSnapPlate";b.type="button";b.className="lmhero";
 b.innerHTML=`<i>${I(IC.cam)}</i><span class="lmht"><b>Snap a plate <em class="pvtag psv">Preview</em></b><small>Photo in, foods, calories and protein out</small></span><span class="lmgo">${I(IC.up)}</span>`;
 g.prepend(b);b.onclick=()=>{document.body.classList.remove("lmopen");const f=$("fab");if(f)f.innerHTML='<svg class="lic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';open();};
}
menu();
function addTab(){const T=$("tab-add");if(!T||$("psAddCard"))return;const c=document.createElement("div");c.className="card pscard";c.id="psAddCard";
 c.innerHTML=`<div class="psci">${I(IC.cam)}</div><div class="psct"><b>Snap a plate <em class="pvtag psv">Preview</em></b><small>Take a photo and log the whole meal in one go</small></div>
 <div class="pscb"><button type="button" id="psAddTake">${I(IC.cam)}Take photo</button><button type="button" class="ghost" id="psAddPick">${I(IC.img)}Choose</button></div>`;
 T.querySelector("h1").after(c);
 $("psAddTake").onclick=()=>{open();setTimeout(()=>$("psCam").click(),50);};$("psAddPick").onclick=()=>{open();setTimeout(()=>$("psLib").click(),50);};}
addTab();
document.head.insertAdjacentHTML("beforeend",`<style id="snapplate">
.pvtag{display:inline-block;font:800 .54rem/1 -apple-system,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;font-style:normal;padding:3px 5px;border-radius:5px;border:1px solid rgba(var(--accrgb),.55);color:var(--acc-hi);vertical-align:middle;margin-left:6px;background:rgba(var(--accrgb),.08)}
#psnap .shd h2{display:flex;align-items:center;gap:8px;font-family:"PJ Cond","Bahnschrift","Oswald",sans-serif;text-transform:uppercase;letter-spacing:.04em;font-weight:650}
#psnap .pshic{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:rgba(var(--accrgb),.14);border:1px solid rgba(var(--accrgb),.35);color:var(--acc)}#psnap .pshic .lic{width:16px;height:16px}
#psnap .lic{width:16px;height:16px;flex:none}
.psdrop{border:1.5px dashed rgba(var(--accrgb),.45);border-radius:18px;padding:18px 14px 14px;text-align:center;background:radial-gradient(120% 90% at 50% 0%,rgba(var(--accrgb),.10),transparent 70%)}
.psdi{width:56px;height:56px;margin:0 auto 8px;border-radius:50%;display:grid;place-items:center;background:rgba(var(--accrgb),.14);border:1px solid rgba(var(--accrgb),.4);color:var(--acc)}.psdi .lic{width:26px!important;height:26px!important}
.psdrop>b{display:block;font-family:"PJ Cond","Bahnschrift","Oswald",sans-serif;font-weight:650;text-transform:uppercase;letter-spacing:.03em;font-size:1.05rem}.psdrop>small{display:block;color:var(--muted);font-size:.78rem;line-height:1.4;margin:4px 6px 12px}
.psbtns{display:grid;grid-template-columns:1fr 1fr;gap:8px}.psbtns button,.pscb button,.pslog{display:flex;align-items:center;justify-content:center;gap:7px}
.pssample{display:flex;align-items:center;gap:12px;width:100%;margin-top:10px;padding:8px;text-align:left;background:rgba(28,32,37,.9)!important;border:1px solid rgba(170,185,200,.18)!important;border-radius:16px!important;color:var(--text)!important;box-shadow:none!important;font-weight:600;min-height:0}
.pssample img{width:58px;height:44px;border-radius:10px;object-fit:cover}.pssample span{flex:1;display:flex;flex-direction:column}.pssample small{color:var(--muted);font-weight:500;font-size:.75rem}.pssample i{color:var(--acc);transform:rotate(90deg)}
#snapNoteLimit a{color:var(--acc-hi);font-weight:600}
.psprv{margin:10px 2px 0;font-size:.68rem;line-height:1.4;color:var(--muted);text-align:center}.psprv a{color:var(--acc-hi)}
.pssamp{display:flex;align-items:center;gap:6px;margin:10px 0 0;padding:8px 10px;border-radius:12px;font-size:.74rem;line-height:1.35;color:var(--text);background:rgba(var(--accrgb),.12);border:1px solid rgba(var(--accrgb),.35)}.pssamp .lic{width:14px;height:14px;flex:none;color:var(--acc-hi)}
.psleft{text-align:center;font-size:.72rem;color:var(--acc-hi);margin:10px 0 0}
.pstips{display:flex;justify-content:space-between;gap:6px;margin:12px 0 4px}.pstips span{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:.68rem;color:var(--muted);text-align:center}.pstips .lic{color:var(--acc-hi)}
.psman{display:flex!important;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:8px;font-size:.8rem}
.psph{position:relative;border-radius:16px;overflow:hidden;background:#111;border:1px solid rgba(170,185,200,.16)}.psph img{display:block;width:100%;height:230px;object-fit:cover}.psph.res img{height:168px}
.psph.scanning img{filter:saturate(.85) brightness(.8)}
.psline{position:absolute;left:0;right:0;height:3px;top:0;background:linear-gradient(90deg,transparent,var(--acc),transparent);box-shadow:0 0 18px 4px rgba(var(--accrgb),.55);animation:psscan 1.6s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes psscan{from{top:4%}to{top:94%}}
.pscor{position:absolute;inset:12px;border:2px solid transparent;border-image:linear-gradient(var(--acc),var(--acc)) 1;-webkit-mask:linear-gradient(#000 0 0) top left/22px 22px no-repeat,linear-gradient(#000 0 0) top right/22px 22px no-repeat,linear-gradient(#000 0 0) bottom left/22px 22px no-repeat,linear-gradient(#000 0 0) bottom right/22px 22px no-repeat;mask:linear-gradient(#000 0 0) top left/22px 22px no-repeat,linear-gradient(#000 0 0) top right/22px 22px no-repeat,linear-gradient(#000 0 0) bottom left/22px 22px no-repeat,linear-gradient(#000 0 0) bottom right/22px 22px no-repeat}
.psstat{text-align:center;margin:16px 0 6px}.psstat b{display:block;font-family:"PJ Cond","Bahnschrift","Oswald",sans-serif;font-weight:650;text-transform:uppercase;letter-spacing:.05em;font-size:1.05rem}.psstat small{color:var(--muted);font-size:.74rem}
.psbar{height:5px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden;margin:10px 30px 8px}.psbar i{display:block;height:100%;width:40%;background:var(--acc);border-radius:9px;animation:psbar 9s cubic-bezier(.1,.7,.3,1) forwards}@keyframes psbar{from{width:6%}to{width:96%}}
.psdot{position:absolute;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:800 .72rem/1 -apple-system,system-ui,sans-serif;color:#fff;background:var(--acc);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5)}.psdot.low{background:#2a2f35;color:var(--acc-hi);border-color:var(--acc-hi);border-style:dashed}
.psretake{position:absolute;right:8px;bottom:8px;display:flex;align-items:center;gap:5px;padding:6px 10px!important;min-height:0!important;font-size:.72rem!important;border-radius:99px!important;background:rgba(15,17,20,.78)!important;color:#fff!important;border:1px solid rgba(255,255,255,.2)!important;box-shadow:none!important}.psretake .lic{width:13px!important;height:13px!important}
.pshead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 2px 8px}.pshead b{display:block;font-family:"PJ Cond","Bahnschrift","Oswald",sans-serif;font-weight:650;text-transform:uppercase;letter-spacing:.04em;font-size:1.02rem}.pshead small{color:var(--muted);font-size:.72rem}
.pstot{display:flex;align-items:baseline;gap:3px;padding:6px 10px;border-radius:12px;background:rgba(var(--accrgb),.12);border:1px solid rgba(var(--accrgb),.35)}.pstot b{font-size:1rem!important;letter-spacing:0!important;text-transform:none!important}.pstot small{margin-right:6px;color:var(--acc-hi)!important}.pstot small:last-child{margin-right:0}
.psitems{display:grid;gap:6px}.psit{display:flex;align-items:center;gap:8px;padding:8px 6px 8px 8px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(170,185,200,.14)}.psit.low{border-color:rgba(var(--accrgb),.45);border-style:dashed}
.psn{flex:0 0 22px;height:22px;border-radius:50%;display:grid;place-items:center;font:800 .7rem/1 -apple-system,system-ui,sans-serif;background:var(--acc);color:#fff}.psit.low .psn{background:transparent;border:1.5px dashed var(--acc-hi);color:var(--acc-hi)}
.psnm{flex:1;min-width:0;display:flex;flex-direction:column}.psnm b{font-size:.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.psnm small{font-size:.7rem;color:var(--muted)}.pschk{display:flex;align-items:flex-start;gap:4px;color:var(--acc-hi)!important;line-height:1.25;margin:1px 0}.pschk .lic{width:12px!important;height:12px!important;margin-top:1px}
.psq{display:flex;align-items:center;gap:2px;flex:none}.psq button{width:28px;height:28px;min-height:0!important;padding:0!important;border-radius:9px!important;display:grid;place-items:center}.psq .lic{width:14px!important;height:14px!important}.psq span{min-width:52px;text-align:center;font-size:.76rem;font-weight:700;font-variant-numeric:tabular-nums}
.psx{width:26px;height:26px;min-height:0!important;padding:0!important;border:0!important;background:transparent!important;color:var(--muted)!important;display:grid;place-items:center;box-shadow:none!important}.psx .lic{width:14px!important;height:14px!important}
.psadd{display:flex;align-items:center;gap:8px;margin-top:8px;padding:0 10px;border-radius:12px;border:1px dashed rgba(170,185,200,.25)}.psadd span{color:var(--muted);display:grid}.psadd input{border:0!important;background:transparent!important;box-shadow:none!important;padding:10px 0!important;flex:1;min-width:0;margin:0!important}
.psaddl{display:grid;gap:4px;margin-top:6px}.psaddl button{display:flex;justify-content:space-between;gap:8px;text-align:left;padding:8px 10px;min-height:0;background:rgba(255,255,255,.04)!important;border:1px solid rgba(170,185,200,.14)!important;color:var(--text)!important;box-shadow:none!important;font-weight:600;font-size:.8rem}.psaddl small{color:var(--muted);flex:none}
.pslog{width:100%;margin-top:12px}.pslog .lic{width:16px!important;height:16px!important}
#lmMenu .lmgrid .lmhero{grid-column:1/-1;display:flex!important;flex-direction:row!important;align-items:center;gap:12px;text-align:left;padding:14px!important;background:linear-gradient(135deg,rgba(var(--accrgb),.22),rgba(28,32,37,.92) 70%)!important;border:1px solid rgba(var(--accrgb),.5)!important}
#lmMenu .lmhero i{flex:none}#lmMenu .lmhero .lmht{flex:1;display:flex;flex-direction:column;gap:2px}#lmMenu .lmhero .lmgo{color:var(--acc);transform:rotate(90deg);display:grid}#lmMenu .lmhero .lmgo .lic{width:18px;height:18px}
.pscard{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center;background:linear-gradient(135deg,rgba(var(--accrgb),.16),rgba(28,32,37,.9) 65%)!important;border:1px solid rgba(var(--accrgb),.45)!important}
.psci{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(var(--accrgb),.16);border:1px solid rgba(var(--accrgb),.4);color:var(--acc)}.psci .lic{width:22px;height:22px}
.psct{display:flex;flex-direction:column}.psct b{font-family:"PJ Cond","Bahnschrift","Oswald",sans-serif;font-weight:650;text-transform:uppercase;letter-spacing:.04em;font-size:1rem}.psct small{color:var(--muted);font-size:.76rem}
.pscb{grid-column:1/-1;display:grid;grid-template-columns:1.4fr 1fr;gap:8px;margin-top:8px}.pscb .lic{width:16px;height:16px}
.psflash{box-shadow:0 0 0 2px var(--acc),0 0 24px rgba(var(--accrgb),.45)!important;transition:box-shadow .3s}
html.pjvreal .pvtag.psv{display:none}
</style>`);
if(PJVision.mode==="edge")document.documentElement.classList.add("pjvreal");
})();
