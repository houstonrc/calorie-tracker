/* Mockup: weekly workout ring + lift log. Data: S.wkGoal={n,kcal}, S.lifts=[{d,ex,sets:[{r,w}]}] */
(function(){
const LIFTS=["Bench Press","Squat","Deadlift","Overhead Press","Barbell Row","Pull-up","Incline DB Press","Romanian Deadlift","Lat Pulldown","Leg Press"];
const IC={
 dumb:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/></svg>',
 chart:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
 trophy:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
 x:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 target:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>'};
const css=`.wring{display:flex;gap:16px;align-items:center;margin:14px 0 4px;padding:14px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.03)}
.wring svg.r{flex:0 0 92px}.wring .wt{flex:1}.wring .wt b{font-family:Oswald,sans-serif;font-size:1.25rem;letter-spacing:.02em;text-transform:uppercase}
.wring .wt small{display:block;color:var(--muted,#9a9a9a);margin-top:2px}.wdots{display:flex;gap:6px;margin-top:10px}.wdots i{flex:1;height:6px;border-radius:3px;background:#2e2e2e}.wdots i.on{background:var(--acc,#f47b20)}
.wstk{display:inline-flex;gap:6px;align-items:center;margin-top:8px;font-size:.8rem;font-weight:700;color:var(--acc-hi,#ff9a45);text-transform:uppercase;letter-spacing:.05em}
#bLift h3 .lh{font-size:.8rem;color:var(--acc-hi,#ff9a45);background:none;border:0;padding:0;display:inline-flex;gap:4px;align-items:center;text-transform:uppercase}
.lpick{display:flex;flex-wrap:wrap;gap:6px}.lpick button{font-size:.78rem;padding:7px 10px}
.lex{border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:10px;background:rgba(255,255,255,.03)}
.lex .lt{display:flex;justify-content:space-between;align-items:center}.lex .lt b{font-size:1rem}
.lex .meta{display:flex;gap:12px;font-size:.75rem;color:var(--muted,#9a9a9a);margin:4px 0 8px}.lex .meta span b{color:#ddd;font-weight:600}.lex .meta .pr b{color:var(--acc-hi,#ff9a45)}
.lset{display:grid;grid-template-columns:28px 1fr 14px 1fr 26px 1fr 28px;gap:6px;align-items:center;font-size:.85rem;margin-top:6px}
.lset input{padding:8px;text-align:center;margin:0;min-width:0}.lset .n{color:var(--muted,#9a9a9a);font-weight:700}.lset .u{color:#888;font-size:.72rem}
#bLift .lset button.del,#bLift .lex button.rm,#bLift h3 button.lh{background:none!important;border:0!important;box-shadow:none!important;color:#8a8a8a;padding:4px!important;width:auto;min-height:0}#bLift h3 button.lh{color:var(--acc-hi,#ff9a45)}#bLift h3{display:flex;justify-content:space-between;align-items:center}.lex .add{margin-top:8px;font-size:.8rem;padding:6px 10px}
.lsum{margin-top:10px;font-size:.8rem;color:var(--muted,#9a9a9a)}
#liftHist .lsel{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}#liftHist .lsel button{white-space:nowrap;font-size:.8rem}
#liftHist .chart{border:1px solid var(--line);border-radius:14px;padding:10px;margin-top:10px;background:rgba(255,255,255,.03)}
#liftHist .prl{margin-top:8px}#liftHist .prr{display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid var(--line)}
#liftHist .prr .nm{flex:1}#liftHist .prr .nm small{display:block;color:var(--muted,#9a9a9a)}#liftHist .prr b{font-family:Oswald,sans-serif;font-size:1.05rem;color:var(--acc-hi,#ff9a45)}
#liftHist .stat{display:flex;gap:8px;margin-top:10px}#liftHist .stat div{flex:1;border:1px solid var(--line);border-radius:12px;padding:8px;text-align:center}#liftHist .stat b{display:block;font-family:Oswald,sans-serif;font-size:1.1rem}#liftHist .stat small{color:var(--muted,#9a9a9a);font-size:.7rem;text-transform:uppercase}
.wgs .stp{display:flex;align-items:center;gap:12px;margin:8px 0}.wgs .stp button{width:44px;height:44px;padding:0;font-size:1.3rem}.wgs .stp b{font-family:Oswald,sans-serif;font-size:2rem;min-width:40px;text-align:center}`;
document.head.insertAdjacentHTML("beforeend",`<style>${css}</style>`);
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const pd=k=>{const[a,b,c]=k.split("-").map(Number);return new Date(a,b-1,c);};
function monday(k){const d=pd(k);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
function weekOf(k){const m=monday(k);let n=0,kc=0;const days=[];for(let i=0;i<7;i++){const d=new Date(m);d.setDate(m.getDate()+i);const L=wkList(ymd(d));n+=L.length;kc+=L.reduce((a,w)=>a+(+w.kcal||0),0);days.push(L.length>0);}return{n,kc,days};}
const G=()=>Object.assign({n:4,kcal:0},S.wkGoal||{});
function met(w){const g=G();return w.n>=g.n&&(!g.kcal||w.kc>=g.kcal);}
function streak(k){let s=0;const m=monday(k);if(met(weekOf(k)))s++;for(let i=1;i<104;i++){const d=new Date(m);d.setDate(m.getDate()-7*i);if(met(weekOf(ymd(d))))s++;else break;}return s;}
function ringSVG(p,p2){const R=38,C=2*Math.PI*R,R2=30,C2=2*Math.PI*R2;return `<svg class="r" viewBox="0 0 92 92"><circle cx="46" cy="46" r="${R}" fill="none" stroke="#2c2c2c" stroke-width="9"/><circle cx="46" cy="46" r="${R}" fill="none" stroke="var(--acc,#f47b20)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C*Math.min(p,1)} ${C}" transform="rotate(-90 46 46)"/>`+(p2!=null?`<circle cx="46" cy="46" r="${R2}" fill="none" stroke="#2c2c2c" stroke-width="5"/><circle cx="46" cy="46" r="${R2}" fill="none" stroke="var(--acc-lt,#f0a24a)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C2*Math.min(p2,1)} ${C2}" transform="rotate(-90 46 46)"/>`:"")+`<text x="46" y="52" text-anchor="middle" fill="#fff" font-family="Oswald,sans-serif" font-size="20" font-weight="700">${Math.round(Math.min(p,1)*100)}%</text></svg>`;}
function ringHTML(){const g=G(),w=weekOf(cur),s=streak(cur);const left=Math.max(0,g.n-w.n);
 return `<div class="wring" id="wRing">${ringSVG(w.n/g.n,g.kcal?w.kc/g.kcal:null)}<div class="wt"><b>${w.n} of ${g.n} workouts</b><small>${left?left+" more to hit this week's goal":"Weekly goal hit"}${g.kcal?` · ${w.kc.toLocaleString()} / ${g.kcal.toLocaleString()} kcal`:""}</small><div class="wdots">${w.days.map(x=>`<i class="${x?"on":""}"></i>`).join("")}</div><span class="wstk">${IC.target} ${s} week streak</span><button type="button" class="link wedit" style="display:block;margin-top:6px;padding:0;font-size:.78rem;background:none;border:0;box-shadow:none;color:var(--acc-hi,#ff9a45)">Edit goal</button></div></div>`;}
const _rb=renderBurnCard;window.renderBurnCard=renderBurnCard=function(){_rb();const el=$("burnCard");if(!el)return;el.querySelector(".bhd").insertAdjacentHTML("afterend",ringHTML());
 if((S.lifts||[]).length)el.insertAdjacentHTML("beforeend",`<button class="ghost small" id="wLiftH" style="margin-top:12px;display:inline-flex;gap:6px;align-items:center">${IC.chart} Lift history &amp; PRs</button>`);const b=$("wLiftH");if(b)b.onclick=()=>openHist();const wr=$("wRing");if(wr){wr.style.cursor="pointer";wr.setAttribute("role","button");wr.setAttribute("aria-label","Edit weekly workout goal");wr.onclick=()=>goGoals("wGoalSet");}};
/* ---- lift log ---- */
let LS=[];// [{ex,sets:[{r,w}]}]
const vol=s=>s.reduce((a,x)=>a+(+x.r||0)*(+x.w||0),0);
const e1=x=>(+x.w||0)*(1+(+x.r||0)/30);
function hist(ex){return(S.lifts||[]).filter(l=>l.ex===ex).sort((a,b)=>a.d<b.d?-1:1);}
function prev(ex){const h=hist(ex).filter(l=>l.d<cur);return h[h.length-1];}
function best(ex){let b=null;hist(ex).forEach(l=>l.sets.forEach(s=>{if(!b||+s.w>+b.w||(+s.w===+b.w&&+s.r>+b.r))b={...s,d:l.d};}));return b;}
const fmtS=s=>s.map(x=>`${x.r}×${x.w}`).join(", ");
const fd=k=>pd(k).toLocaleDateString(undefined,{month:"short",day:"numeric"});
document.getElementById("bActs").insertAdjacentHTML("afterend",`<div id="bLift" style="display:none"><h3>Lift log <button type="button" class="lh" id="bLiftH">${IC.chart} History</button></h3><div class="lpick" id="lPick"></div><div id="lList"></div><div class="lsum" id="lSum"></div></div>`);
function drawLift(){const box=$("bLift");box.style.display=BS.act==="lift"?"":"none";if(BS.act!=="lift")return;
 $("lPick").innerHTML=LIFTS.filter(n=>!LS.some(l=>l.ex===n)).map(n=>`<button type="button" class="ghost" data-ex="${n}">+ ${n}</button>`).join("");
 $("lList").innerHTML=LS.map((l,i)=>{const p=prev(l.ex),b=best(l.ex);return `<div class="lex" data-i="${i}"><div class="lt"><b>${esc(l.ex)}</b><button type="button" class="rm" aria-label="Remove">${IC.x}</button></div><div class="meta"><span>Last${p?" "+fd(p.d):""}: <b>${p?fmtS(p.sets):"none"}</b></span><span class="pr">PR: <b>${b?b.w+" lb × "+b.r:"none"}</b></span></div>`+
  l.sets.map((s,j)=>`<div class="lset" data-j="${j}"><span class="n">${j+1}</span><input inputmode="numeric" data-f="r" value="${s.r}" aria-label="Reps"><span class="u">×</span><input inputmode="decimal" data-f="w" value="${s.w}" aria-label="Weight"><span class="u">lb</span><span></span><button type="button" class="del" aria-label="Remove set">${IC.x}</button></div>`).join("")+`<button type="button" class="ghost add">+ Add set</button></div>`;}).join("");
 const v=LS.reduce((a,l)=>a+vol(l.sets),0),ns=LS.reduce((a,l)=>a+l.sets.length,0);$("lSum").textContent=LS.length?`${LS.length} exercises · ${ns} sets · ${v.toLocaleString()} lb volume`:"Pick lifts above to log sets, reps and weight.";
 $("lPick").querySelectorAll("button").forEach(b=>b.onclick=()=>{const ex=b.dataset.ex,p=prev(ex);LS.push({ex,sets:p?p.sets.map(s=>({...s})):[{r:8,w:""}]});drawLift();});
 $("lList").querySelectorAll(".lex").forEach(el=>{const l=LS[+el.dataset.i];el.querySelector(".rm").onclick=()=>{LS.splice(+el.dataset.i,1);drawLift();};
  el.querySelector(".add").onclick=()=>{const t=l.sets[l.sets.length-1]||{r:8,w:""};l.sets.push({...t});drawLift();};
  el.querySelectorAll(".lset").forEach(r=>{const s=l.sets[+r.dataset.j];r.querySelector(".del").onclick=()=>{l.sets.splice(+r.dataset.j,1);drawLift();};r.querySelectorAll("input").forEach(inp=>inp.oninput=()=>{s[inp.dataset.f]=inp.value;});});});
 $("bLiftH").onclick=()=>openHist();}
const _db=drawBurn;window.drawBurn=drawBurn=function(){_db();drawLift();};
$("bSave").addEventListener("click",()=>{if(BS.act!=="lift"||!LS.length)return;S.lifts=S.lifts||[];LS.forEach(l=>{const sets=l.sets.filter(s=>+s.r>0);if(sets.length)S.lifts.push({d:cur,ex:l.ex,sets:sets.map(s=>({r:+s.r,w:+s.w||0}))});});LS=[];save();},true);
/* ---- history ---- */
document.body.insertAdjacentHTML("beforeend",`<dialog id="liftHist" class="tall"><div class="shd"><h2>Lifts</h2><button type="button" class="ghost small" id="lhClose">Close</button></div><div class="lsel" id="lhSel"></div><div class="chart" id="lhChart"></div><div class="stat" id="lhStat"></div><h3 style="display:flex;gap:6px;align-items:center">${IC.trophy} Personal records</h3><div class="prl" id="lhPR"></div></dialog>`);
$("lhClose").onclick=()=>$("liftHist").close();
let HX=null;
function chart(ex){const h=hist(ex);const pts=h.map(l=>({d:l.d,v:Math.max(...l.sets.map(s=>+s.w))}));if(!pts.length)return"";
 if(pts.length===1){const ss=h[0].sets.filter(s=>+s.r>0||+s.w>0),reps=ss.reduce((a,s)=>a+(+s.r||0),0),vol=ss.reduce((a,s)=>a+(+s.r||0)*(+s.w||0),0);
  return `<div class="lh1"><div class="lh1k">FIRST SESSION · ${fd(pts[0].d)}</div><div class="lh1v">${pts[0].v}<small> lb top set</small></div><div class="lh1g"><div><b>${ss.length}</b><span>sets</span></div><div><b>${reps}</b><span>reps</span></div><div><b>${vol.toLocaleString()}</b><span>lb volume</span></div></div><p class="lh1n">Nice start. Log ${esc(ex)} again and your progress chart shows up here.</p></div>`;}
 const W=330,H=170,pl=34,pr=10,pt=14,pb=24;const lo=Math.min(...pts.map(p=>p.v)),hi=Math.max(...pts.map(p=>p.v));const mn=Math.floor((lo-10)/10)*10,mx=Math.ceil((hi+10)/10)*10;
 const X=i=>pl+(pts.length<2?0:i*(W-pl-pr)/(pts.length-1)),Y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
 let g="";for(let i=0;i<=3;i++){const v=mn+(mx-mn)*i/3;g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#2c2c2c"/><text x="${pl-6}" y="${Y(v)+4}" fill="#888" font-size="10" text-anchor="end">${Math.round(v)}</text>`;}
 const line=pts.map((p,i)=>`${i?"L":"M"}${X(i)},${Y(p.v)}`).join("");const area=line+`L${X(pts.length-1)},${H-pb}L${X(0)},${H-pb}Z`;
 const lab=[0,Math.floor((pts.length-1)/2),pts.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>`<text x="${X(i)}" y="${H-6}" fill="#888" font-size="10" text-anchor="${i===0?"start":i===pts.length-1?"end":"middle"}">${fd(pts[i].d)}</text>`).join("");
 return `<div style="display:flex;justify-content:space-between;font-size:.8rem;color:#aaa;margin-bottom:4px"><span>Top set weight (lb)</span><span>${pts.length} session${pts.length===1?"":"s"}</span></div><svg viewBox="0 0 ${W} ${H}" width="100%"><defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f47b20" stop-opacity=".35"/><stop offset="1" stop-color="#f47b20" stop-opacity="0"/></linearGradient></defs>${g}<path d="${area}" fill="url(#lg)"/><path d="${line}" fill="none" stroke="var(--acc,#f47b20)" stroke-width="2.5" stroke-linejoin="round"/>${pts.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.v)}" r="3.5" fill="#1b1b1b" stroke="var(--acc-hi,#ff9a45)" stroke-width="2"/>`).join("")}${lab}</svg>`;}
function drawHist(){const exs=[...new Set((S.lifts||[]).map(l=>l.ex))];const _emp=!exs.length;["lhChart","lhStat","lhPR"].forEach(i=>$(i).style.display=_emp?"none":"");{const h3=$("lhPR").previousElementSibling;if(h3)h3.style.display=_emp?"none":"";}
 let _e=$("lhEmpty");if(!_e){$("lhSel").insertAdjacentHTML("afterend",`<div id="lhEmpty" class="emst"><span class="emi">${IC.dumb||""}</span><div class="emt"><b>No lifts logged yet</b><small>Log a lift with sets, reps and weight to track your best sets, est. 1RM and personal records.</small></div><button type="button" id="lhEmptyGo">Log a lift</button></div>`);_e=$("lhEmpty");
  $("lhEmptyGo").onclick=()=>{$("liftHist").close();if(!$("burn").open&&typeof openBurn==="function")openBurn();setTimeout(()=>{const b=document.querySelector('#burn [data-a="lift"]');b&&b.click();const l=$("bLift");l&&l.scrollIntoView({block:"start",behavior:"smooth"});},60);};}
 _e.style.display=_emp?"":"none";if(_emp){$("lhSel").innerHTML="";return;}if(!HX||!exs.includes(HX))HX=exs[0];
 $("lhSel").innerHTML=exs.map(e=>`<button type="button" class="${e===HX?"":"ghost"}" data-e="${e}">${esc(e)}</button>`).join("");
 $("lhSel").querySelectorAll("button").forEach(b=>b.onclick=()=>{HX=b.dataset.e;drawHist();});
 $("lhChart").innerHTML=chart(HX);const h=hist(HX),b=best(HX);const first=h[0]?Math.max(...h[0].sets.map(s=>s.w)):0,last=h.length?Math.max(...h[h.length-1].sets.map(s=>s.w)):0;
 $("lhStat").innerHTML=`<div><b>${b?b.w:"-"}</b><small>Best lb</small></div><div><b>${b?Math.round(e1(b)):"-"}</b><small>Est. 1RM</small></div><div><b>${last-first>=0?"+":""}${last-first}</b><small>Since ${h[0]?fd(h[0].d):""}</small></div>`;
 $("lhPR").innerHTML=exs.map(e=>{const p=best(e);return `<div class="prr"><span class="nm">${esc(e)}<small>${fd(p.d)} · est. 1RM ${Math.round(e1(p))} lb</small></span><b>${p.w} lb × ${p.r}</b></div>`;}).join("");}
function openHist(){drawHist();$("liftHist").showModal();}
window.openLiftHist=openHist;
/* ---- settings ---- */
const sp=document.querySelector('#tab-settings .sp[data-p="goals"]');
sp.querySelector(".sphead").insertAdjacentHTML("afterend",`<div class="card wgs" id="wGoalSet"><div style="display:flex;gap:10px;align-items:center"><span class="ri">${IC.target}</span><b style="flex:1">Weekly workout goal</b></div><p class="fine" style="margin:6px 0 0">Fills the ring on Today. Hit it every week to build your streak.</p><label style="margin-top:12px">Workouts per week</label><div class="stp"><button type="button" class="ghost" id="wgM">−</button><b id="wgN"></b><button type="button" class="ghost" id="wgP">+</button></div><label for="wgK">Weekly burn goal (optional, kcal)</label><input type="number" id="wgK" inputmode="numeric" placeholder="e.g. 2000"><div class="chips" id="wgKc" style="margin-top:8px"></div></div>`);
function drawGS(){const g=G();$("wgN").textContent=g.n;$("wgK").value=g.kcal||"";$("wgKc").innerHTML=[0,1500,2000,3000].map(v=>`<button type="button" class="ghost ${v===g.kcal?"on":""}" data-k="${v}">${v?v.toLocaleString():"Off"}</button>`).join("");$("wgKc").querySelectorAll("button").forEach(b=>b.onclick=()=>setG({kcal:+b.dataset.k}));}
function setG(o){S.wkGoal=Object.assign(G(),o);save();drawGS();if(typeof renderToday==="function")renderToday();}
$("wgM").onclick=()=>setG({n:Math.max(1,G().n-1)});$("wgP").onclick=()=>setG({n:Math.min(14,G().n+1)});$("wgK").onchange=e=>setG({kcal:Math.max(0,Math.round(+e.target.value||0))});
document.addEventListener("DOMContentLoaded",drawGS);if(document.readyState!=="loading")setTimeout(drawGS);
try{if(typeof renderToday==="function"&&typeof S!=="undefined")renderToday();}catch(e){}
})();
