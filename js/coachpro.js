/* Jack Coach Pro (build 8): daily game plan, Fix My Day, gym-day mode, Sunday check-in.
   On-device only. Uses existing recipes, costs, fridge, logs and workouts. No network. */
(function(){
"use strict";

const FLOOR=1200, LOW=800, LEGAL="Not medical advice. Talk to a doctor about medical conditions, pregnancy or medications.";
const TAKEOUT=/take[- ]?out|delivery|doordash|uber\s*eats|chipotle|mcdonald|wendy|burger\s*king|kfc|popeyes|chick[- ]?fil|taco\s*bell|chipotle|panda\s*express|domino|pizza\s*hut|papa\s*john|five\s*guys|sonic|whataburger|raising\s*cane|zaxby|starbucks|dunkin|subway|wingstop|buffalo\s*wild|applebee|chili'?s|ihop|denny|olive\s*garden|panera|jersey\s*mike|firehouse|qboba|shake\s*shack/i;
const TAKEOUT_FOOD=/^(caesar|house)?\s*(pizza|burger|fries|nugget|taco|burrito|quesadilla|nacho|hot dog|fried chicken|wings|chinese takeout|lo mein|pad thai|sushi roll)/i;

function on(){try{return typeof canUse==="function"&&canUse("coachFull");}catch(e){return false;}}
function nowHour(){return window._jackHour!=null?+window._jackHour:new Date().getHours();}
function isToday(){try{return cur===ymd(new Date());}catch(e){return true;}}
function calGoal(k){try{const g=typeof goalFor==="function"?goalFor(k): (S.goal||0);return g||S.goal||0;}catch(e){return (S&&S.goal)||0;}}
function pGoal(){return (S.macros&&+S.macros.p)||0;}
function dayTarget(k){return Math.max(calGoal(k)||0, FLOOR);}
function recipes(){try{return (typeof ALLR==="function"?ALLR():[]).filter(r=>r&&r.cal>0&&r.p!=null);}catch(e){return [];}}
function rCost(r){try{const c=recipeCost(r);return c&&isFinite(c.per)?c.per:null;}catch(e){return null;}}
function fridgeItems(){try{return (S.fridge||[]).filter(i=>i&&i.name&&(i.serv==null||i.serv>0));}catch(e){return [];}}
function fridgeNames(){return fridgeItems().map(i=>String(i.name||"").toLowerCase()).filter(Boolean);}
function usesFridge(r, names){
  if(!names.length||!r.ing) return 0;
  let n=0;
  r.ing.forEach(([nm])=>{
    const s=String(nm||"").toLowerCase();
    if(names.some(f=>s.includes(f)||f.includes(s.split(",")[0].trim()))) n++;
  });
  return n;
}
function mealsLeft(){
  const have=new Set((day().entries||[]).map(e=>e.meal));
  const hr=(isToday()?nowHour():12);
  const eaten=eatenOf();
  const needP=Math.max(0, (pGoal()+gymProteinBump())-eaten.p);
  const needC=Math.max(0, dayTarget()-eaten.cal);
  const order=["Breakfast","Lunch","Dinner","Snacks"];
  return order.filter(m=>{
    if(have.has(m)) return false;
    if(!isToday()) return m!=="Snacks" || needC>250 || needP>20;
    if(m==="Breakfast"&&hr>=11&&have.size) return false;
    if(m==="Snacks" && needC<250 && needP<20) return false;
    return true;
  });
}
function spendLeft(){
  const b=+S.budget||0;
  if(!b) return null;
  try{return Math.max(0, b-weekSpend().t);}catch(e){return b;}
}
function eatenOf(k){try{return totals(k);}catch(e){return {cal:0,p:0,c:0,f:0};}}

/* Restriction / low-intake guardrail. Jack goes gentle and does not push a deficit. */
function jackGentle(k){
  k=k|| (typeof cur!=="undefined"?cur:null);
  if(!k) try{k=ymd(new Date());}catch(e){return false;}
  const t=eatenOf(k), hr=nowHour(), today=k===ymd(new Date());
  if(today&&hr>=17&&t.cal>0&&t.cal<LOW) return true;
  if(today&&hr>=20&&t.cal===0) return false; /* empty late day is "not logged", not restriction */
  try{
    const keys=rangeKeys(7);
    const lows=keys.filter(d=>{
      const e=day(d).entries||[];
      return e.length && totals(d).cal>0 && totals(d).cal<LOW;
    });
    if(lows.length>=3) return true;
  }catch(e){}
  return false;
}

function pickRecipe({calLeft, pLeft, budgetLeft, meal, highP, avoid}){
  const list=recipes();
  const names=fridgeNames();
  const avoidId=avoid?new Set(avoid):new Set();
  const mealOk=r=>{
    if(!meal) return true;
    if(meal==="Snacks") return !r.meal || r.meal==="Snacks" || ((+r.cal||0)<=350);
    return !r.meal || r.meal===meal || (meal==="Lunch"&&r.meal==="Dinner") || (meal==="Dinner"&&r.meal==="Lunch");
  };
  let best=null, bestScore=-1e9;
  list.forEach(r=>{
    if(avoidId.has(r.id)) return;
    if(!mealOk(r)) return;
    const cost=rCost(r);
    const cal=+r.cal||0, p=+r.p||0;
    if(calLeft!=null && calLeft>=200 && cal>calLeft+80) return;
    if(budgetLeft!=null && cost!=null && cost>budgetLeft+0.5 && budgetLeft<cost) return;
    let s=0;
    if(highP || (pLeft!=null && pLeft>0)) s += Math.min(p, Math.max(pLeft||30, 30))*3;
    if(calLeft!=null && calLeft>0) s -= Math.abs(cal-Math.min(calLeft, 650))*0.04;
    if(cost!=null) s += (p/Math.max(cost,0.5))*2 - cost*0.8;
    s += usesFridge(r, names)*18;
    if(r.tags&&r.tags.includes("Budget")) s += 6;
    if(r.tags&&r.tags.includes("High protein")) s += 8;
    if(r.tags&&r.tags.includes("Quick")) s += 3;
    if(s>bestScore){bestScore=s;best=r;}
  });
  return best;
}

function planDay(){
  const gentle=jackGentle();
  const eaten=eatenOf();
  const target=dayTarget();
  const floorNeed=Math.max(0, FLOOR-eaten.cal);
  let calLeft=Math.max(target-eaten.cal, floorNeed);
  if(gentle) calLeft=Math.max(calLeft, Math.max(0, 1400-eaten.cal));
  let pLeft=Math.max(0, (pGoal() + gymProteinBump()) - eaten.p);
  let bLeft=spendLeft();
  const slots=mealsLeft();
  const picks=[], used=[];
  if(!slots.length) return {picks, gentle, target, eaten, calLeft:0, pLeft, bLeft, done:true};
  const share=slots.length;
  slots.forEach((meal,i)=>{
    const leftSlots=share-i;
    const calShare=calLeft/leftSlots;
    const pShare=pLeft/leftSlots;
    const bShare=bLeft!=null?bLeft/leftSlots:null;
    const r=pickRecipe({
      calLeft: Math.max(calShare, gentle?400:220),
      pLeft: pShare,
      budgetLeft: bShare,
      meal,
      highP: pLeft>15 || !!gymBump().on,
      avoid: used
    });
    if(!r) return;
    used.push(r.id);
    const cost=rCost(r);
    picks.push({meal, r, cost});
    calLeft=Math.max(0, calLeft-(+r.cal||0));
    pLeft=Math.max(0, pLeft-(+r.p||0));
    if(bLeft!=null&&cost!=null) bLeft=Math.max(0, bLeft-cost);
  });
  return {picks, gentle, target, eaten, calLeft, pLeft, bLeft, done:false};
}

function gymBump(k){
  k=k|| (typeof cur!=="undefined"?cur:ymd(new Date()));
  let n=0, kcal=0;
  try{
    const L=typeof wkList==="function"?wkList(k):((day(k).workouts)||[]);
    n=L.length;
    kcal=L.reduce((a,w)=>a+(+w.kcal||0),0);
  }catch(e){}
  if(!n) return {on:false, cal:0, p:0, kcal:0, n:0};
  let cal=0;
  try{cal=typeof burnBonus==="function"?burnBonus(k):Math.round(kcal*0.5);}catch(e){cal=Math.round(kcal*0.5);}
  if(!(cal>0)) cal=150; /* conservative bump when a workout is logged without active calories */
  const p=Math.max(15, Math.min(30, Math.round(cal*0.25/4)));
  return {on:true, cal, p, kcal, n};
}
function gymProteinBump(){return gymBump().on?gymBump().p:0;}

function isTakeout(en){
  const n=String((en&&en.name)||"");
  if(TAKEOUT.test(n)||TAKEOUT_FOOD.test(n)) return true;
  try{
    if(typeof catEmoji==="function"){
      const e=catEmoji(n);
      if(["🍔","🍕","🍟","🌭","🌮","🥡","🥪"].includes(e)) return true;
    }
  }catch(err){}
  return false;
}
function isHeavy(en){
  const cal=(+en.cal||0)*(+en.qty||1);
  const g=calGoal()||2000;
  return cal>=700 || cal>=g*0.35;
}
function similarHome(en){
  const meal=en&&en.meal;
  const cal=(+en.cal||0)*(+en.qty||1);
  const p=(+en.p||0)*(+en.qty||1);
  return pickRecipe({calLeft: cal||600, pLeft: Math.max(p, 25), meal, highP:true, avoid: en&&en.rid?[en.rid]:[]});
}

function voicePlan(plan){
  if(plan.gentle){
    return "You've barely eaten today. That's not a win. Grab a solid meal with protein and carbs. Food is fuel — let's fix that, gently.";
  }
  if(plan.done){
    const t=plan.eaten, g=pGoal();
    if(g && t.p>=g) return "Plate's full and protein is in. That's a jacked day. Don't undo it with late-night grazing.";
    if(g && t.p<g) return "Meals are logged, but protein is still short. A yogurt, tuna or eggs would close it. Easy win.";
    return "That's a full log. Nice work. Keep it consistent tomorrow.";
  }
  if(!plan.picks.length) return "I don't have a tight recipe fit yet. Log what you have, and I'll tighten the rest.";
  const bits=plan.picks.map(p=>{
    const c=p.cost!=null?` (about $${p.cost.toFixed(2)} est.)`:"";
    return `${p.r.name} for ${p.meal.toLowerCase()}${c}`;
  });
  let line="Eat "+ (bits.length===1?bits[0]:bits.slice(0,-1).join(", ")+" and "+bits[bits.length-1]) +".";
  const fr=plan.picks.filter(p=>usesFridge(p.r, fridgeNames()));
  if(fr.length) line+=" That uses what's already in the fridge.";
  const b=spendLeft();
  if(b!=null) line+=` That keeps you on ${Math.round(plan.target).toLocaleString()} calories with about $${b.toFixed(0)} of budget still in play (est.).`;
  else line+=` That keeps you pointed at ${Math.round(plan.target).toLocaleString()} calories.`;
  return line;
}

function voiceGym(g, rec){
  const burn=g.kcal?`You logged about ${Math.round(g.kcal).toLocaleString()} active calories. `:"";
  const recLine=rec?` Cheap protein: ${rec.name} is about ${rec.p}g protein`+(rCost(rec)!=null?` for $${rCost(rec).toFixed(2)} a serving (est.).`:"."):"";
  return `${burn}Gym day. I raised today's target by ${g.cal} calories and ${g.p}g protein. Fuel the work — don't starve it.${recLine}`;
}

function voiceFix(plan, cmp){
  if(plan.gentle) return "I'm not cutting this day harder. Eat something solid first. We'll plan the rest after you're fed.";
  let line="Here's the rest of today, rebuilt to stay on calories";
  if(spendLeft()!=null) line+=" and budget";
  line+=".";
  if(plan.picks.length){
    line+=" "+plan.picks.map(p=>`${p.r.name} for ${p.meal.toLowerCase()}`).join("; ")+".";
  }
  if(cmp&&cmp.home && cmp.homeCost!=null){
    line+=` A similar meal at home, ${cmp.home.name}, is about $${cmp.homeCost.toFixed(2)} a serving (est.)`;
    if(cmp.loggedCost!=null) line+=`, vs about $${cmp.loggedCost.toFixed(2)} logged (est.)`;
    line+=".";
  }
  return line;
}

function weekReview(){
  const keys=rangeKeys(7);
  const pg=pGoal(), g=S.goal;
  let logged=0, pHit=0, onT=0;
  keys.forEach(k=>{
    const es=day(k).entries||[];
    if(!es.length) return;
    logged++;
    const t=totals(k);
    if(pg && t.p>=pg*0.9) pHit++;
    if(g){const gk=calGoal(k)||g; if(t.cal>=gk*0.85 && t.cal<=gk*1.1) onT++;}
  });
  const spend=(()=>{try{return weekSpend().t;}catch(e){return 0;}})();
  const budget=+S.budget||0;
  const consist=logged/7;
  const pScore=pg?pHit/7:null;
  const cScore=g?onT/7:null;
  let mScore=null, moneyLabel="No weekly budget set";
  if(budget){
    const ratio=spend/budget;
    mScore=ratio<=1?1:Math.max(0, 1-(ratio-1)/0.8);
    moneyLabel=spend<=budget
      ? `$${spend.toFixed(0)} of $${budget.toFixed(0)} (est.)`
      : `$${spend.toFixed(0)} of $${budget.toFixed(0)} · over (est.)`;
  }else if(spend>0){
    moneyLabel=`$${spend.toFixed(0)} spent (est.)`;
  }
  const parts=[consist];
  if(pScore!=null) parts.push(pScore);
  if(cScore!=null) parts.push(cScore);
  if(mScore!=null) parts.push(mScore);
  const avg=parts.reduce((a,b)=>a+b,0)/parts.length;
  const letter=avg>=0.9?"A":avg>=0.8?"B":avg>=0.65?"C":avg>=0.5?"D":"F";
  const order=weekOrder({logged,pHit,pg,onT,g,budget,spend,consist});
  return {
    keys, logged, pHit, pg, onT, g, spend, budget, consist, pScore, cScore, mScore,
    letter, order, moneyLabel, dates: typeof rptDates==="function"?rptDates(keys):keys[0]+" – "+keys[6]
  };
}

function weekOrder(w){
  if(w.consist<0.5) return "Log something every day this week, even if it's small. The streak is the whole game.";
  if(w.pg && w.pHit<4) return "Hit protein at least five days this week. Eggs, Greek yogurt, chicken or tuna — pick one and repeat.";
  if(w.budget && w.spend>w.budget) return "Budget went over. Plan two pantry meals (eggs, beans, rice) before you shop again.";
  if(w.g && w.onT<4) return "Land closer to your calorie goal four days this week. A planned lunch does most of the work.";
  if(w.consist<0.9) return "Don't get soft on the weekend. Log Saturday and Sunday like they're real days.";
  if(w.budget && w.spend<=w.budget) return "Budget held. Keep one cheap high-protein staple in the fridge all week.";
  return "You were consistent. Do it again. Same protein target, same logging habit.";
}

function voiceWeek(w){
  const p=w.pg?`Protein days: ${w.pHit} of 7. `:"";
  const c=w.g?`Calories on target: ${w.onT} of 7. `:"";
  const m=`Money: ${w.moneyLabel}. `;
  const l=`You logged ${w.logged} of 7 days. `;
  return `Grade: ${w.letter}. ${p}${c}${m}${l}${w.order}`;
}

const $$=(id)=>document.getElementById(id);
function money(n){return n==null?"—":"$"+Number(n).toFixed(2);}

function mount(){
  let el=$$("coachPro");
  if(!el){
    el=document.createElement("div");
    el.id="coachPro";
    el.className="jpro";
    const meals=$$("meals");
    const sect=meals && meals.closest?meals.previousElementSibling:null;
    const hook= (sect && sect.classList && sect.classList.contains("sect")) ? sect : meals;
    const tab=$$("tab-today");
    if(hook&&hook.parentNode) hook.parentNode.insertBefore(el, hook);
    else if(tab) tab.appendChild(el);
  }
  if(!$$("jackShare")){
    const d=document.createElement("dialog");
    d.id="jackShare";
    d.innerHTML=`<div class="shd"><h2>Jack graded my week</h2><button type="button" class="ghost small" id="jackShareX">Close</button></div>
      <div class="rptbox" id="jackShareBox"><img id="jackShareImg" alt="Sunday check-in card"></div>
      <p class="fine" id="jackShareLegal">${LEGAL}</p>
      <div class="row" style="margin-top:12px"><button type="button" id="jackShareBtn">Share</button><button type="button" class="ghost" id="jackDlBtn">Download</button></div>`;
    document.body.appendChild(d);
    d.querySelector("#jackShareX").onclick=()=>d.close();
    d.querySelector("#jackDlBtn").onclick=()=>jackDownload();
    d.querySelector("#jackShareBtn").onclick=()=>jackShareOut();
  }
  return el;
}

function render(){
  const el=mount();
  if(!on() || (S.coach||{}).on===false){el.style.display="none";el.innerHTML="";return;}
  if(!isToday() && !window._forceSunday){/* still allow viewing plans for other days */ }
  el.style.display="";
  const plan=planDay();
  const gym=isToday()?gymBump():{on:false};
  const sunday=window._forceSunday || new Date().getDay()===0;
  const week=sunday?weekReview():null;
  const banner=window._jackFixBanner||null;
  const fix=window._jackFix||null;

  const disc=`<p class="fine jpro-legal">${LEGAL}</p>`;
  let html="";

  if(banner){
    html+=`<div class="card jpro-card jpro-ban" id="jackBan"><div class="jpro-hd"><span class="cav">${ico("alert")}</span><b>Fix my day?</b></div>
      <p class="jpro-line">${esc(banner.msg)}</p>
      <div class="jpro-act"><button type="button" id="jackBanGo">Fix my day</button><button type="button" class="ghost" id="jackBanNo">Not now</button></div></div>`;
  }

  const hr=nowHour();
  const planTitle=(!isToday()?"Game plan":hr<11?"Morning game plan":"Today's game plan");
  html+=`<div class="card jpro-card" id="jackPlan"><div class="jpro-hd"><span class="cav">${ico("bulb")}</span><b>${planTitle}</b></div>
    <p class="jpro-line">${esc(voicePlan(plan))}</p>`;
  if(plan.picks.length){
    html+=`<ul class="jpro-meals">`+plan.picks.map((p,i)=>`<li data-ri="${i}"><b>${esc(p.meal)}</b> ${esc(p.r.name)}<small>${Math.round(p.r.cal)} kcal · ${Math.round(p.r.p)}g protein${p.cost!=null?` · ${money(p.cost)} est.`:""}</small></li>`).join("")+`</ul>`;
  }
  html+=`<div class="jpro-act"><button type="button" id="jackFixBtn">Fix my day</button></div></div>`;

  if(gym.on){
    const rec=pickRecipe({calLeft: Math.max(350, dayTarget()-eatenOf().cal), pLeft: pGoal()+gym.p, budgetLeft: spendLeft(), highP:true, meal:"Dinner"});
    html+=`<div class="card jpro-card" id="jackGym"><div class="jpro-hd"><span class="cav">${ico("dumbbell")}</span><b>Gym-day mode</b></div>
      <p class="jpro-line">${esc(voiceGym(gym, rec))}</p>
      <p class="jpro-meta">Today's targets: ${Math.round(dayTarget()).toLocaleString()} kcal${pGoal()?` · ${pGoal()+gym.p}g protein`:""}. ${gym.kcal?`Uses your logged active calories (half added, same as Settings).`:`No active calories on the workout, so this is a conservative bump.`}</p>`;
    if(rec) html+=`<button type="button" class="link" id="jackGymRec" data-rid="${esc(rec.id)}">See ${esc(rec.name)}</button>`;
    html+=`</div>`;
  }

  if(week){
    html+=`<div class="card jpro-card" id="jackWeek"><div class="jpro-hd"><span class="cav">${ico("star")}</span><b>Sunday check-in</b><span class="jpro-grade">${esc(week.letter)}</span></div>
      <p class="jpro-line">${esc(voiceWeek(week))}</p>
      <ul class="jpro-stats">
        <li><b>${week.pHit}/7</b><span>Protein days hit</span></li>
        <li><b>${week.g?week.onT+"/7":"—"}</b><span>Calories vs goal</span></li>
        <li><b>${esc(week.budget?"$" + week.spend.toFixed(0):week.spend?("$"+week.spend.toFixed(0)):"—")}</b><span>${week.budget?"Money vs budget":"Money spent"}</span></li>
        <li><b>${week.logged}/7</b><span>Days logged</span></li>
      </ul>
      <p class="jpro-order"><b>One order for next week:</b> ${esc(week.order)}</p>
      <div class="jpro-act"><button type="button" id="jackWeekShare">Share card</button></div></div>`;
  }

  if(fix){
    html+=`<div class="card jpro-card" id="jackFixOut"><div class="jpro-hd"><span class="cav">${ico("refresh")}</span><b>Fix my day</b></div>
      <p class="jpro-line">${esc(fix.line)}</p>`;
    if(fix.picks&&fix.picks.length){
      html+=`<ul class="jpro-meals">`+fix.picks.map((p,i)=>`<li data-fi="${i}"><b>${esc(p.meal)}</b> ${esc(p.r.name)}<small>${Math.round(p.r.cal)} kcal · ${Math.round(p.r.p)}g protein${p.cost!=null?` · ${money(p.cost)} est.`:""}</small></li>`).join("")+`</ul>`;
    }
    if(fix.cmp&&fix.cmp.home){
      html+=`<p class="jpro-meta">At-home swap (est.): ${esc(fix.cmp.home.name)} is ${money(fix.cmp.homeCost)} a serving${fix.cmp.loggedCost!=null?`, vs ${money(fix.cmp.loggedCost)} logged`:""}. Prices are estimates from the app's recipe costs.</p>`;
    }
    html+=`</div>`;
  }

  html+=disc;
  el.innerHTML=html;
  bind(el, plan, week);
}

function bind(el, plan, week){
  const go=$$("jackFixBtn"); if(go) go.onclick=()=>runFix();
  const banGo=$$("jackBanGo"); if(banGo) banGo.onclick=()=>{window._jackFixBanner=null;runFix();};
  const banNo=$$("jackBanNo"); if(banNo) banNo.onclick=()=>{window._jackFixBanner=null;render();};
  const sh=$$("jackWeekShare"); if(sh) sh.onclick=()=>openShare(week);
  const gr=$$("jackGymRec"); if(gr) gr.onclick=()=>{const r=recipes().find(x=>x.id===gr.dataset.rid); if(r&&typeof openRecipe==="function") openRecipe(r);};
  el.querySelectorAll("[data-ri]").forEach(li=>{
    li.onclick=()=>{const p=plan.picks[+li.dataset.ri]; if(p&&typeof openRecipe==="function") openRecipe(p.r);};
  });
  el.querySelectorAll("[data-fi]").forEach(li=>{
    li.onclick=()=>{const p=(window._jackFix&&window._jackFix.picks||[])[+li.dataset.fi]; if(p&&typeof openRecipe==="function") openRecipe(p.r);};
  });
}

function runFix(fromEntry){
  window._jackFixBanner=null;
  if(!on()){ if(typeof openPay==="function") openPay("coach"); return; }
  if(jackGentle()){
    window._jackFix={line:voiceFix({gentle:true,picks:[]},null), picks:[], cmp:null, gentle:true};
    render();
    try{ $$("jackFixOut").scrollIntoView({block:"center"}); }catch(e){}
    return;
  }
  const plan=planDay();
  let cmp=null;
  const en=fromEntry||window._jackFixEntry;
  if(en){
    const home=similarHome(en);
    let loggedCost=null;
    try{
      if(en.rid || (en.cost!=null&&+en.cost>0)) loggedCost=typeof entryCost==="function"?entryCost(en):(+en.cost||null);
      else if(!isTakeout(en)) loggedCost=typeof entryCost==="function"?entryCost(en):null;
    }catch(e){}
    if(home){
      cmp={name:en.name, home, homeCost:rCost(home), loggedCost, takeout:isTakeout(en)};
    }
  }
  window._jackFix={line:voiceFix(plan,cmp), picks:plan.picks, cmp, gentle:false};
  render();
  try{ $$("jackFixOut").scrollIntoView({block:"center"}); }catch(e){}
}

function afterLog(en){
  if(!on()||!isToday()||!en) return;
  const take=isTakeout(en), heavy=isHeavy(en);
  let over=false;
  try{
    const b=+S.budget||0;
    if(b && weekSpend().t>b) over=true;
  }catch(e){}
  if(!(take||heavy||over)) return;
  if(jackGentle()) return;
  window._jackFixEntry=en;
  const why=take?"That looks like takeout.": over?"That pushed the weekly food budget (est.).":"That was a heavy plate.";
  window._jackFixBanner={msg:why+" I can rebuild the rest of today to stay on calories and budget, and show what a similar meal would cost at home (est.)."};
  render();
}

let jackBlob=null;
function jackName(){return `platejack-jack-week-${ymd(new Date())}.png`;}
function jackDownload(){
  if(!jackBlob) return;
  const a=document.createElement("a");
  a.href=URL.createObjectURL(jackBlob);
  a.download=jackName();
  document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
  if(typeof toast==="function") toast("Saved image");
}
async function jackShareOut(){
  if(!jackBlob) return;
  const f=new File([jackBlob],jackName(),{type:"image/png"});
  if(navigator.canShare&&navigator.canShare({files:[f]})){
    try{await navigator.share({files:[f], title:"Jack graded my week", text:"Jack graded my week. #PlateJack"});}
    catch(e){if(e&&e.name!=="AbortError") jackDownload();}
  }else jackDownload();
}

async function drawWeekCard(w){
  const W=1080,H=1920,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  try{await document.fonts.load('700 40px "PJ Cond"');}catch(e){}
  const a1=(typeof ACCENTS==="object"&&typeof accentKey==="function"&&ACCENTS[accentKey()]&&ACCENTS[accentKey()][1])||"#ff8a2a";
  const a2="#c4520f";
  const ink="#f2f4f6", mute="rgba(200,210,220,.72)";
  let logo=null;
  try{logo=typeof rptLoad==="function"?await rptLoad("icon-512.png"):null;}catch(e){}
  x.fillStyle="#121417"; x.fillRect(0,0,W,H);
  const rg=x.createRadialGradient(W/2,H*0.32,20,W/2,H*0.32,W*0.7);
  rg.addColorStop(0,"rgba(196,82,15,.45)"); rg.addColorStop(1,"rgba(18,20,23,0)");
  x.fillStyle=rg; x.fillRect(0,0,W,H);

  /* Centered logo + grade for captions */
  const logoS=160, lx=(W-logoS)/2, ly=220;
  if(logo){
    x.save();
    if(typeof rrect==="function"){rrect(x,lx,ly,logoS,logoS,36);x.clip();}
    x.drawImage(logo,lx,ly,logoS,logoS);
    x.restore();
  }
  x.textAlign="center"; x.textBaseline="alphabetic";
  x.font=`900 86px "PJ Cond","Arial Black",sans-serif`;
  x.fillStyle=ink; const twP=x.measureText("PLATE").width;
  const nameY=ly+logoS+100;
  /* measure PLATEJACK as a lockup */
  x.font=`900 86px "PJ Cond","Arial Black",sans-serif`;
  const pW=x.measureText("PLATE").width, jW=x.measureText("JACK").width;
  const start=(W-(pW+jW))/2;
  x.textAlign="left";
  x.fillStyle=ink; x.fillText("PLATE", start, nameY);
  const jg=x.createLinearGradient(start+pW,0,start+pW+jW,0);
  jg.addColorStop(0,"#ffe2a0"); jg.addColorStop(.4,a1); jg.addColorStop(1,"#d0603f");
  x.fillStyle=jg; x.fillText("JACK", start+pW, nameY);
  x.textAlign="center";
  x.font=`700 28px -apple-system,system-ui,sans-serif`;
  x.fillStyle=mute; x.letterSpacing="6px";
  x.fillText("EAT WELL. SPEND LESS.", W/2, nameY+48);
  x.letterSpacing="0px";

  x.font=`800 26px -apple-system,sans-serif`; x.fillStyle=a1; x.letterSpacing="5px";
  x.fillText("JACK GRADED MY WEEK", W/2, nameY+120);
  x.letterSpacing="0px";
  x.font=`700 28px -apple-system,sans-serif`; x.fillStyle="#d7dde4";
  x.fillText(String(w.dates||""), W/2, nameY+168);

  /* Giant grade, centered */
  const gradeY=nameY+470;
  x.font=`900 360px "PJ Cond","Arial Black",sans-serif`;
  const hg=x.createLinearGradient(0,gradeY-300,0,gradeY);
  hg.addColorStop(0,"#ffe2a0"); hg.addColorStop(.5,a1); hg.addColorStop(1,"#d0603f");
  x.fillStyle=hg; x.fillText(w.letter, W/2, gradeY);

  /* Habit + money stats only — never weight or body */
  const stats=[
    [w.pHit+"/7", "Protein days hit"],
    [w.g?w.onT+"/7":"—", "Calories vs goal"],
    [w.budget?("$"+Math.round(w.spend)) : (w.spend?("$"+Math.round(w.spend)):"—"), w.budget?"Money vs budget":"Money spent (est.)"],
    [w.logged+"/7", "Days logged"]
  ];
  const cols=2, gap=24, P=80, cw=(W-2*P-gap)/2, ch=150, y0=gradeY+80;
  stats.forEach(([v,l],i)=>{
    const cx=P+(i%cols)*(cw+gap), cy=y0+Math.floor(i/cols)*(ch+gap);
    x.textAlign="left";
    if(typeof rrect==="function") rrect(x,cx,cy,cw,ch,28); else {x.beginPath();x.rect(cx,cy,cw,ch);}
    x.fillStyle="rgba(255,255,255,.09)"; x.fill();
    x.strokeStyle="rgba(255,255,255,.12)"; x.lineWidth=2; x.stroke();
    x.font=`900 56px "PJ Cond","Arial Black",sans-serif`; x.fillStyle=ink;
    x.fillText(v, cx+28, cy+78);
    x.font=`600 22px -apple-system,sans-serif`; x.fillStyle=mute;
    x.fillText(l, cx+28, cy+118);
  });

  const oy=y0+2*(ch+gap)+20;
  if(typeof rrect==="function") rrect(x,P,oy,W-2*P,220,28); else {x.beginPath();x.rect(P,oy,W-2*P,220);}
  x.fillStyle="rgba(255,255,255,.07)"; x.fill();
  x.textAlign="left";
  x.font=`800 22px -apple-system,sans-serif`; x.fillStyle=a1; x.letterSpacing="3px";
  x.fillText("ONE ORDER FOR NEXT WEEK", P+32, oy+48);
  x.letterSpacing="0px";
  x.font=`600 28px -apple-system,sans-serif`; x.fillStyle=ink;
  wrapText(x, w.order, P+32, oy+96, W-2*P-64, 36);

  x.font=`900 30px "PJ Cond","Arial Black",sans-serif`; x.fillStyle=ink;
  x.fillText("platejack", P, H-56);
  x.textAlign="right";
  x.font=`600 18px -apple-system,sans-serif`; x.fillStyle=mute;
  x.fillText(LEGAL, W-P, H-56);
  x.textAlign="left";
  return c;
}

function wrapText(x,t,X,Y,max,lh){
  const words=String(t).split(/\s+/); let line="", y=Y;
  words.forEach((w,i)=>{
    const n=line?line+" "+w:w;
    if(x.measureText(n).width>max && line){ x.fillText(line,X,y); y+=lh; line=w; }
    else line=n;
    if(i===words.length-1) x.fillText(line,X,y);
  });
}

async function openShare(week){
  const w=week||weekReview();
  const box=$$("jackShareBox"), img=$$("jackShareImg"), dlg=$$("jackShare");
  if(!dlg) return;
  dlg.showModal();
  if(box) box.classList.add("busy");
  try{
    const c=await drawWeekCard(w);
    const bl=await new Promise(r=>{try{c.toBlob(r,"image/png");}catch(e){r(null);}});
    jackBlob=bl;
    if(img&&bl){const u=URL.createObjectURL(bl); if(img._u) URL.revokeObjectURL(img._u); img._u=u; img.src=u;}
  }catch(e){ if(typeof toast==="function") toast("Couldn't build the card"); }
  if(box) box.classList.remove("busy");
}

function hook(){
  if(typeof renderToday==="function" && !renderToday._jack){
    const _rt=renderToday;
    renderToday=function(){ const r=_rt.apply(this,arguments); try{render();}catch(e){console.warn("jack coach",e);} return r; };
    renderToday._jack=1;
    window.renderToday=renderToday;
  }
  if(typeof addEntry==="function" && !addEntry._jack){
    const _ae=addEntry;
    addEntry=function(en){ const r=_ae.apply(this,arguments); try{afterLog(en);}catch(e){} return r; };
    addEntry._jack=1;
    window.addEntry=addEntry;
  }
  /* Conservative gym-day calorie bump when a workout is logged without active calories.
     If burn bonus already applies, goalFor is left unchanged (no double count). */
  if(typeof goalFor==="function" && !goalFor._jack){
    const _gf=goalFor;
    goalFor=function(k){
      const g=_gf.apply(this,arguments);
      try{
        if(!on()) return g;
        const kk=k||cur;
        const burned=typeof burnOf==="function"?burnOf(kk):0;
        const n=typeof wkList==="function"?wkList(kk).length:0;
        if(n && !(burned>0)) return (g||S.goal||0)+150;
      }catch(e){}
      return g;
    };
    goalFor._jack=1;
    window.goalFor=goalFor;
  }
}

function injectCSS(){
  if($$("jpro-css")) return;
  const s=document.createElement("style");
  s.id="jpro-css";
  s.textContent=`
  #coachPro.jpro{margin:8px 0 6px;scroll-margin-top:78px}
  .jpro-card{margin-top:14px!important;scroll-margin-top:78px}
  .jpro-hd{display:flex;align-items:center;gap:8px;font-size:.95rem}
  .jpro-hd .cav{flex:none;width:32px;height:32px;display:grid;place-items:center;overflow:hidden}
  .jpro-hd b{font-weight:800}
  .jpro-grade{margin-left:auto;font-family:"PJ Cond","Oswald",sans-serif;font-weight:900;font-size:1.8rem;color:var(--acc,#ff8a2a);line-height:1}
  .jpro-line{margin:10px 0 0;font-size:.95rem;line-height:1.45}
  .jpro-meta,.jpro-order{margin:10px 0 0;font-size:.82rem;color:var(--muted,#97a1ad);line-height:1.4}
  .jpro-order b{color:var(--text,#eef1f4);display:block;margin-bottom:4px}
  .jpro-meals{list-style:none;margin:12px 0 0;padding:0}
  .jpro-meals li{padding:10px 0;border-top:1px solid var(--line,rgba(160,175,190,.14));cursor:pointer}
  .jpro-meals li b{display:block;font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;color:var(--acc,#ff8a2a)}
  .jpro-meals li small{display:block;opacity:.7;font-size:.8rem;margin-top:2px}
  .jpro-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 0;padding:0;list-style:none}
  .jpro-stats li{background:rgba(255,255,255,.06);border-radius:16px;padding:12px}
  .jpro-stats b{display:block;font-size:1.15rem}
  .jpro-stats span{font-size:.75rem;opacity:.7}
  .jpro-act{display:flex;gap:10px;margin-top:14px}
  .jpro-act button{flex:1}
  .jpro-legal{margin:14px 4px 4px!important;font-size:.75rem!important;line-height:1.4}
  #jackShare{max-width:420px;width:calc(100% - 24px)}
  #jackShareBox{background:#121417;border-radius:16px;overflow:hidden;min-height:200px}
  #jackShareBox img{display:block;width:100%;height:auto}
  #jackShareBox.busy{opacity:.5}
  `;
  document.head.appendChild(s);
}

/* Public hooks for QA */
window.jackCoachPro={
  render, planDay, weekReview, jackGentle, gymBump, runFix, drawWeekCard, afterLog,
  FLOOR, LOW, LEGAL, isOn:on
};

injectCSS();
hook();
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>{hook();try{render();}catch(e){}});
else { try{render();}catch(e){} }
})();
