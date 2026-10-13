/* ---------- PREVIEW: progressive feature reveal ---------- */
(function(){
const RV=()=>S.reveal||(S.reveal={start:ymd(new Date()),seen:{},opt:{}});
function stats(){const ks=Object.keys(S.days||{}).filter(k=>(S.days[k].entries||[]).length).sort();const anyRid=ks.some(k=>S.days[k].entries.some(e=>e.rid));const gro=!!(S.grocery&&Object.keys(S.grocery.checked||{}).length)||Object.keys(S.plan||{}).some(k=>(S.plan[k]||[]).length);
 const since=Math.round((parse(ymd(new Date()))-parse(RV().start))/864e5)+1;return {logged:ks.length,first:ks.length>0,anyRid,gro,since};}
function feats(){const s=stats(),o=RV().opt;const week=s.logged>=7||(s.since>=7&&s.logged>=3);
 return {recipes:s.first,budget:s.logged>=3||!!o.budget,fridge:s.anyRid||s.gro||!!o.fridge,week,pro:week||!!o.pro};}
const INTRO={recipes:["🥡","New: Meal-prep recipes","60 budget-friendly recipes with cost per serving. Log a serving in one tap.","See recipes",()=>openPrep()],
 budget:["💵","New: Budget mode","Set a weekly food budget and see estimated spend as you log.","Set budget",()=>openBudget()],
 fridge:["🧊","New: Fridge Rescue","Keep a simple fridge list. Leftovers and bought groceries go there, and you'll get dinner ideas before food expires.","Open fridge",()=>openFridge()],
 week:["📅","New: Planner, Coach & Plate Report","You've logged a week. Plan ahead, get gentle coaching, and share your weekly Plate Report.","Open planner",()=>showTab("plan")]};
function apply(){const f=feats(),h=document.documentElement;["recipes","budget","fridge","week","pro"].forEach(k=>h.classList.toggle("rv-"+k,!!f[k]));h.classList.add("rv");
 const s=stats();const fl=$("rvFirst");if(fl)fl.style.display=s.first?"none":"";
 const nx=["recipes","budget","fridge","week"].find(k=>f[k]&&!RV().seen[k]);const c=$("rvNew");
 if(nx){const [e,t,d,b]=INTRO[nx];c.innerHTML=`<span class="rvi">${e}</span><span class="rvl"><b>${t}</b><small>${d}</small><span class="rvb"><button class="small" data-go="${nx}">${b}</button><button class="ghost small" data-ok="${nx}">Got it</button></span></span>`;c.style.display="";}else c.style.display="none";
 const opt=$("rvOpt");if(opt)opt.style.display=!f.budget&&s.first?"":"none";
 const st=$("rvStage");if(st)st.textContent=`Preview stage · ${s.logged} day${s.logged==1?"":"s"} logged`;}
$("rvNew").onclick=e=>{const g=e.target.closest("[data-go]"),k=e.target.closest("[data-ok]");if(g){RV().seen[g.dataset.go]=1;save();apply();INTRO[g.dataset.go][4]();}else if(k){RV().seen[k.dataset.ok]=1;save();apply();}};
$("rvFirstBtn").onclick=()=>{showTab("add");setTimeout(()=>$("search").focus(),60);};
$("rvOpt").onclick=()=>{RV().opt.budget=1;save();apply();};
// hidden skip-ahead: tap the PlateJack logo 5 times (or open with ?rv=1)
let taps=0,tt=0;document.querySelector("#appbar .brand").addEventListener("click",()=>{clearTimeout(tt);tt=setTimeout(()=>taps=0,1500);if(++taps>=5){taps=0;$("rvSkip").showModal();}});
if(/[?&]rv=1/.test(location.search))setTimeout(()=>$("rvSkip").showModal(),900);
function seed(n){const keep={goal:S.goal||2000,macros:S.macros,name:S.name,theme:S.theme};const d=blank();Object.assign(d,keep,{goal:keep.goal||2000,intro:false,onb:1});S=migrate(d);
 const start=new Date();start.setDate(start.getDate()-(n-1));S.reveal={start:ymd(start),seen:{},opt:{}};
 const F=[["Oatmeal, cooked","Breakfast"],["Banana","Breakfast"],["Chicken breast, grilled","Lunch"],["Brown rice, cooked","Lunch"],["Salmon, baked","Dinner"],["Broccoli, steamed","Dinner"]];
 const days=n===1?0:n;for(let i=0;i<days;i++){const dt=new Date();dt.setDate(dt.getDate()-(days-1-i));const k=ymd(dt);const E=[];
  F.forEach(([nm,m],j)=>{const f=FOODS.find(x=>x[0]===nm);if(f)E.push({id:k+j,t:dt.getTime(),name:f[0]+" ("+f[1]+")",cal:f[2],p:f[3],c:f[4],f:f[5],qty:1,meal:m});});
  if(i===days-1){const r=RECIPES.find(x=>x.id==="crb");E.push({id:k+"r",t:dt.getTime(),name:r.name,serving:"1 serving",cal:r.cal,p:r.p,c:r.c,f:r.f,qty:1,meal:"Dinner",rid:r.id});}
  if(n>=7||i<days-1)S.days[k]={entries:E,water:4};else S.days[k]={entries:E.filter(e=>!e.rid||n>=3),water:2};}
 if(n>=3){S.reveal.seen={recipes:1};}
 if(n>=7){S.reveal.seen={recipes:1,budget:1,fridge:1};S.budget=75;S.fridge=[{id:"f1",name:"Baby spinach",amt:"half bag",use:ymd(new Date()),src:"manual"},{id:"f2",name:"Chicken, Rice & Broccoli Bowls",rid:"crb",serv:3,amt:"3 servings",use:ymd(new Date(Date.now()+3*864e5)),src:"leftover",cost:2.6}];}
 save();$("rvSkip").close();cur=ymd(new Date());renderAll();showTab("today");apply();toast(`Preview: day ${n}`);}
$("rvSkip").onclick=e=>{const b=e.target.closest("[data-d]");if(b)seed(+b.dataset.d);if(e.target.closest("#rvSkipX"))$("rvSkip").close();};
const rt=renderToday;renderToday=function(){rt();try{apply();}catch(e){console.warn(e)}};
// Pro only after value: block paywall before then
const op=openPay;openPay=function(w){if(!feats().pro){toast("That arrives later in the preview");return;}op(w);};
const st0=showTab;showTab=function(t){if((t==="plan"||t==="history")&&!feats().week)t="today";st0(t);};
apply();})();
