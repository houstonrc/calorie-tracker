/* Quick Burn: workout / activity tracker. Data: day.workouts=[{id,act,min,int,kcal,manual}], S.recentWk=[...] (both optional). */
const ACTS=[["walk","Walking","🚶",{easy:2.8,moderate:3.5,intense:5}],["run","Running","🏃",{easy:7,moderate:9.8,intense:11.5}],["lift","Lifting","🏋️",{easy:3.5,moderate:5,intense:6}],["bike","Cycling","🚴",{easy:4,moderate:6.8,intense:10}],["bball","Basketball","🏀",{easy:4.5,moderate:6.5,intense:8}],["yard","Yard work","🌿",{easy:3,moderate:4,intense:5.5}],["hiit","HIIT","⚡",{easy:6,moderate:8,intense:10}],["swim","Swimming","🏊",{easy:5,moderate:7,intense:9.8}],["other","Other","✨",{easy:3,moderate:5,intense:7}]];
const ACT=Object.fromEntries(ACTS.map(a=>[a[0],a]));
function wkList(k=cur){const d=S.days[k];return d&&Array.isArray(d.workouts)?d.workouts:[];}
function burnOf(k=cur){return Math.round(wkList(k).reduce((a,w)=>a+(+w.kcal||0),0));}
function bodyKg(){const ks=Object.keys(S.weights||{}).sort();if(ks.length)return S.weights[ks[ks.length-1]]*0.4536;if(+S.wkKg)return +S.wkKg;return 0;}
function estKcal(act,min,int,kg){const a=ACT[act]||ACT.other;return Math.round(a[3][int]*(kg||80)*min/60);}
const BS={act:"walk",min:30,int:"moderate",mode:"est"};
function wkLabel(w){const a=ACT[w.act]||ACT.other;return w.manual?`${a[2]} ${a[1]} · ${w.min?w.min+" min · ":""}${w.kcal} kcal`:`${a[2]} ${a[1]} · ${w.min} min · ${w.int}`;}
function renderBurnCard(){const el=$("burnCard");if(!el)return;const L=wkList(),b=burnOf(),R=(S.recentWk||[]).slice(0,4);
 el.innerHTML=`<div class="bhd"><span class="ri">🔥</span><span class="rl"><b>Activity</b><small>${b?`Burned ${b.toLocaleString()} · +${burnBonus().toLocaleString()} to goal (${S.burnFull?"full":"half"})`:"Workouts add calories to today's goal"}</small></span><button class="small" id="wkAdd">＋ Add workout</button></div>`+
 (R.length?`<div class="chips wkchips">${R.map((w,i)=>`<button class="ghost" data-rc="${i}">${(ACT[w.act]||ACT.other)[2]} ${esc((ACT[w.act]||ACT.other)[1])} ${w.manual?w.kcal+" kcal":w.min+"m"}</button>`).join("")}</div>`:"")+
 (L.length?`<div class="wklist">${L.map(w=>`<div class="entry" data-wid="${w.id}"><div class="n">${esc(wkLabel(w))}</div><b class="bk">−${w.kcal}</b><button class="ghost small wdel" aria-label="Remove">✕</button></div>`).join("")}</div>`:"");
 $("wkAdd").onclick=openBurn;
 el.querySelectorAll("[data-rc]").forEach(bt=>bt.onclick=()=>{const w=R[+bt.dataset.rc];const kcal=w.manual?w.kcal:estKcal(w.act,w.min,w.int,bodyKg()||80);addWk({act:w.act,min:w.min,int:w.int,kcal,manual:!!w.manual});});
 el.querySelectorAll(".wdel").forEach(bt=>bt.onclick=()=>{const id=bt.closest("[data-wid]").dataset.wid;const d=dayW();d.workouts=(d.workouts||[]).filter(w=>w.id!==id);save();renderToday();toast("Workout removed");});}
function addWk(w){const b0=burnBonus();const d=dayW();if(!Array.isArray(d.workouts))d.workouts=[];w.id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);d.workouts.push(w);
 const key=x=>x.act+"|"+(x.manual?"m"+x.kcal:x.min+x.int);S.recentWk=[{act:w.act,min:w.min,int:w.int,kcal:w.kcal,manual:w.manual},...(S.recentWk||[]).filter(x=>key(x)!==key(w))].slice(0,6);
 save();renderToday();const add=burnBonus()-b0;toast(`Burned ~${w.kcal.toLocaleString()} kcal, +${add.toLocaleString()} added to today's goal`);}
function openBurn(){const dl=$("burn");drawBurn();dl.showModal();}
function drawBurn(){const kg=bodyKg();const est=estKcal(BS.act,BS.min,BS.int,kg||80);
 $("bActs").innerHTML=ACTS.map(a=>`<button type="button" class="${a[0]===BS.act?"on":""}" data-a="${a[0]}">${a[2]} ${a[1]}</button>`).join("");
 $("bInts").innerHTML=["easy","moderate","intense"].map(i=>`<button type="button" class="${i===BS.int?"on":""}" data-i="${i}">${i[0].toUpperCase()+i.slice(1)}</button>`).join("");
 $("bModes").innerHTML=[["est","Estimate for me"],["man","Type exact number"]].map(([m,n])=>`<button type="button" class="${m===BS.mode?"on":""}" data-m="${m}">${n}</button>`).join("");
 $("bEstBox").style.display=BS.mode==="est"?"":"none";$("bManBox").style.display=BS.mode==="man"?"":"none";
 $("bMinV").textContent=BS.min+" min";$("bMin").value=BS.min;
 $("bKgRow").style.display=kg?"none":"";$("bEst").textContent=est.toLocaleString();
 $("bWho").textContent=kg?`Based on your weight (${Math.round(kg/0.4536)} lb)`:"Using 176 lb (80 kg) until you add your weight";
 $("bActs").querySelectorAll("button").forEach(b=>b.onclick=()=>{BS.act=b.dataset.a;drawBurn();});
 $("bInts").querySelectorAll("button").forEach(b=>b.onclick=()=>{BS.int=b.dataset.i;drawBurn();});
 $("bModes").querySelectorAll("button").forEach(b=>b.onclick=()=>{BS.mode=b.dataset.m;drawBurn();});}
function initBurn(){$("bMin").oninput=e=>{BS.min=+e.target.value;$("bMinV").textContent=BS.min+" min";$("bEst").textContent=estKcal(BS.act,BS.min,BS.int,bodyKg()||80).toLocaleString();};
 $("bKgSave").onclick=()=>{const lb=+$("bLb").value;if(lb>50&&lb<700){S.wkKg=lb*0.4536;save();drawBurn();}else toast("Enter your weight in lb");};
 $("bClose").onclick=()=>$("burn").close();
 $("bSave").onclick=()=>{if(BS.mode==="man"){const k=Math.round(+$("bKcal").value);if(!(k>0&&k<5000)){toast("Enter the calories from your watch or machine");return;}addWk({act:BS.act,min:+$("bManMin").value||0,int:"",kcal:k,manual:true});$("bKcal").value="";}
  else addWk({act:BS.act,min:BS.min,int:BS.int,kcal:estKcal(BS.act,BS.min,BS.int,bodyKg()||80),manual:false});$("burn").close();};}
document.addEventListener("DOMContentLoaded",initBurn);
function burnFactor(){return S.burnFull?1:0.5;}
function burnBonus(k=cur){return Math.round(burnOf(k)*burnFactor());}
function goalFor(k=cur){return S.goal?S.goal+burnBonus(k):0;}
function renderBurnSet(){let el=$("burnSet");if(!el){const L=$("sList");if(!L)return;el=document.createElement("div");el.className="card";el.id="burnSet";L.after(el);}const f=!!S.burnFull;
 el.innerHTML=`<div class="bhd"><span class="ri">🔥</span><span class="rl"><b>Workout calories added to goal</b><small>${f?"All burned calories raise your goal.":"Half is safer, since workout estimates often run high."}</small></span></div><div class="chips" style="margin-top:14px"><button class="${f?"ghost":"on"}" data-bf="0">Half (recommended)</button><button class="${f?"on":"ghost"}" data-bf="1">Full</button></div>`;
 el.querySelectorAll("[data-bf]").forEach(b=>b.onclick=()=>{S.burnFull=b.dataset.bf==="1";save();renderBurnSet();renderToday();toast(S.burnFull?"Full workout calories added to goal":"Half of workout calories added to goal");});}
document.addEventListener("DOMContentLoaded",()=>setTimeout(renderBurnSet,0));
