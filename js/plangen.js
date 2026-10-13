/* PlateJack plan generator. Shared by the app (window.PG) and tools/build-plans.js (require).
   gen(R, price, opts) → plan. Constraints: diet filter (strict), quick filter (strict), each recipe ≤2×/week,
   leftovers: each slot cooks once and eats twice on consecutive days, daily kcal tuned by portion size, budget, protein. */
(function(root){
const FISH=/salmon|tuna|cod|tilapia|catfish|shrimp/i,PORK=/pork|bacon|ham\b/i,MEATW=/chicken|turkey|beef|pork|steak|sausage|broth \(chicken\)|chicken broth/i;
const DAIRY=/milk|yogurt|cheese|cheddar|mozzarella|parmesan|feta|ricotta|butter|sour cream|cottage|protein powder|granola/i,NOTDAIRY=/almond milk|coconut milk|peanut butter|almond butter/i;
function flags(r){if(r._fl)return r._fl;const ns=r.ing.map(i=>i[0]);const meat=r.ing.some(i=>i[3]==1&&!FISH.test(i[0]))||ns.some(n=>/chicken broth/i.test(n));const fish=ns.some(n=>FISH.test(n));
 const dairy=ns.some(n=>DAIRY.test(n)&&!NOTDAIRY.test(n));return r._fl={veg:!meat&&!fish,pesc:!meat,dairyFree:!dairy,noPork:!ns.some(n=>PORK.test(n)),quick:r.cook<=20&&r.prep<=15,lowc:r.meal==="Snacks"?r.c<=25:r.c<=50};}
const DIETS={any:"Any",veg:"Vegetarian",pesc:"Pescatarian",lowc:"Low carb",dairyFree:"Dairy-free",noPork:"No pork"};
function okDiet(r,d){const f=flags(r);return d==="any"||d==="lowc"?true:!!f[d];}
function slotsFor(mpd){return mpd<=2?["Lunch","Dinner"]:mpd===3?["Breakfast","Lunch","Dinner"]:mpd===4?["Breakfast","Lunch","Dinner","Snacks"]:["Breakfast","Lunch","Dinner","Snacks","Snacks"];}
function rng(seed){let s=(seed>>>0)%2147483647||7;return()=>(s=(s*16807)%2147483647)/2147483647;}
// leftover pairing: slot k uses day-groups shifted so batches rotate; each group = same recipe (cook once, eat twice)
function groups(k){const off=k%2;const g=[];if(off){g.push([0]);for(let d=1;d<7;d+=2)g.push([d,d+1]);}else{for(let d=0;d<6;d+=2)g.push([d,d+1]);g.push([6]);}return g;}
const QM=[0.75,1,1.25,1.5,1.75,2,2.5,3],QS=[1,1.5,2,2.5,3];
function protTarget(o){const pct={lose:.30,maintain:.25,gain:.25,hp:.35}[o.goal||"maintain"]||.25;return o.protein||Math.round(o.kcal*pct/4);}
function carbAvg(e,cx){let c=0;e.days.forEach(L=>L.forEach(([id,q])=>{const r=cx.byId[id];if(r)c+=r.c*q;}));return c/7;}
function carbCap(o){return o.diet==="lowc"?Math.round(o.kcal*.30/4):Infinity;}
function makeCtx(R,price,o){const per=r=>r._pc!=null?r._pc:(r._pc=r.ing.reduce((t,[n,q,u])=>t+((price[n+"|"+u])||0)*q,0)/r.serv);
 const S=slotsFor(o.mpd||4);const pool={};["Breakfast","Lunch","Dinner","Snacks"].forEach(m=>pool[m]=R.filter(r=>r.meal===m&&okDiet(r,o.diet||"any")&&(!o.quick||flags(r).quick||(m==="Snacks"&&r.cook<=25))&&!(o.exclude||[]).includes(r.id)));
 if(o.diet==="lowc")["Breakfast","Lunch","Dinner"].forEach(m=>{const a=pool[m].slice().sort((x,y)=>x.c/x.cal-y.c/y.cal);pool[m]=a.slice(0,Math.max(6,Math.ceil(a.length*.45)));});
 const notes=[];if(o.quick)["Breakfast","Lunch","Dinner","Snacks"].forEach(m=>{if(S.includes(m)&&pool[m].length<4){pool[m]=R.filter(r=>r.meal===m&&okDiet(r,o.diet||"any")&&!(o.exclude||[]).includes(r.id));notes.push("Not enough quick "+m.toLowerCase()+" recipes for this diet, so some take longer.");}});
 return {per,S,pool,notes,P:protTarget(o),C:carbCap(o),T:o.kcal,ppl:o.people||1,memo:new Map(),byId:Object.fromEntries(R.map(r=>[r.id,r]))};}
// choose per-day portions for the slot recipes (per person) to hit kcal, protein-aware
function tuneDay(cx,rs){const key=rs.map(r=>r.id).join(',');if(cx.memo&&cx.memo.has(key))return cx.memo.get(key);const T=cx.T;let best=null;const n=rs.length;const nm=rs.filter(r=>r.meal!=="Snacks").length||1,pm=T/nm,qm=pm>1050?QM:pm>800?QM.slice(0,7):QM.slice(0,6),qs=rs.filter(r=>r.meal==="Snacks").length>1?[1,1.5,2]:QS;const opts=rs.map(r=>r.meal==="Snacks"?qs:qm);
 const idx=new Array(n).fill(0);
 for(;;){let k=0,p=0,c=0,cost=0;for(let i=0;i<n;i++){const q=opts[i][idx[i]],r=rs[i];k+=r.cal*q;p+=r.p*q;c+=r.c*q;cost+=cx.per(r)*q;}
  const dev=Math.abs(k-T)/T;const sc=dev*10+Math.max(0,cx.P-p)/cx.P*2+(c>cx.C?(c-cx.C)/cx.C*5:0)+cost*0.004;
  if(!best||sc<best.sc)best={sc,q:idx.map((j,i)=>opts[i][j]),k,p,c,cost,dev};
  let i=0;while(i<n){idx[i]++;if(idx[i]<opts[i].length)break;idx[i]=0;i++;}if(i===n)break;}
 if(cx.memo)cx.memo.set(key,best);return best;}
function evalPlan(cx,o,pick){const days=[];let cost=0,sc=0,K=0,Pp=0,maxDev=0;const cnt={};
 for(let d=0;d<7;d++){const rs=cx.S.map((m,k)=>pick[k][d]);rs.forEach(r=>cnt[r.id]=(cnt[r.id]||0)+1);const t=tuneDay(cx,rs);days.push(rs.map((r,i)=>[r.id,t.q[i]]));
  cost+=t.cost*cx.ppl;K+=t.k;Pp+=t.p;maxDev=Math.max(maxDev,t.dev);sc+=t.sc;}
 const over=Object.values(cnt).reduce((a,v)=>a+Math.max(0,v-2),0);const dup=Object.keys(cnt).length;
 const B=o.budget;sc+=(B&&cost>B?(cost-B)/B*120:0)+(B?0:cost/(70*cx.ppl)*.6)+over*50+Math.max(0,maxDev-.05)*400;
 if(o.avoid)sc+=Object.keys(cnt).reduce((a,id)=>a+(o.avoid[id]||0),0)*(o.avoidW||.15);
 return {sc,days,cost,kcal:K/7,p:Pp/7,maxDev,distinct:dup};}
function gen(R,price,o,seed){o=Object.assign({mpd:4,people:1,diet:"any",goal:"maintain"},o);const cx=makeCtx(R,price,o);const rnd=rng(seed||Date.now());const pk=a=>a[Math.floor(rnd()*a.length)];
 for(const m of cx.S)if(cx.pool[m].length<4)return {error:"Not enough "+m.toLowerCase()+" recipes match these filters."};
 const build=()=>cx.S.map((m,k)=>{const arr=new Array(7);const used=[];groups(k).forEach(g=>{let r,t=0;do{r=pk(cx.pool[m]);t++;}while(used.includes(r.id)&&t<20);used.push(r.id);g.forEach(d=>arr[d]=r);});return arr;});
 const mut=pick=>{const n=pick.map(a=>a.slice());const k=Math.floor(rnd()*cx.S.length);const G=groups(k);const g=G[Math.floor(rnd()*G.length)];
  if(rnd()<.25){const g2=G[Math.floor(rnd()*G.length)];const a=n[k][g[0]],b=n[k][g2[0]];g.forEach(d=>n[k][d]=b);g2.forEach(d=>n[k][d]=a);}else{const r=pk(cx.pool[cx.S[k]]);g.forEach(d=>n[k][d]=r);}return n;};
 let best=null;const RS=o.restarts||5,IT=o.iters||500;
 for(let s=0;s<RS;s++){let p=build(),e=evalPlan(cx,o,p);for(let i=0;i<IT;i++){const n=mut(p),f=evalPlan(cx,o,n);if(f.sc<=e.sc){p=n;e=f;}}if(!best||e.sc<best.e.sc)best={p,e};}
 const e=best.e;const ppl=cx.ppl;
 return {days:e.days.map(L=>L.map(([id,q])=>[id,Math.round(q*ppl*100)/100])),people:ppl,cost:e.cost,kcal:e.kcal,p:e.p,maxDev:e.maxDev,protTarget:cx.P,
  notes:(cx.C<Infinity&&carbAvg(e,cx)>cx.C*1.2?["Carbs average above the low-carb target with this budget. A bigger budget helps."]:[]).concat(Math.abs(e.kcal-o.kcal)/o.kcal>.05?cx.notes.concat(["Couldn't reach "+o.kcal+" kcal/day with these settings. Try more meals per day"+(o.diet==="lowc"||o.quick?", fewer filters":"")+(o.budget?" or a bigger budget":"")+"."]):cx.notes),budgetOk:!o.budget||e.cost<=o.budget+0.01,kcalOk:Math.abs(e.kcal-o.kcal)/o.kcal<=.05,opts:o};}
// swap one meal on one day; keeps diet/quick/≤2x and re-tunes that day's portions
function swap(R,price,plan,d,i,seed){const o=plan.opts;const cx=makeCtx(R,price,o);const rnd=rng(seed||Date.now());const ppl=plan.people||1;
 const day=plan.days[d];const cur=R.find(r=>r.id===day[i][0]);const cnt={};plan.days.forEach(L=>L.forEach(([id])=>cnt[id]=(cnt[id]||0)+1));
 const cand=cx.pool[cur.meal].filter(r=>r.id!==cur.id&&(cnt[r.id]||0)<2&&!day.some(([id])=>id===r.id));if(!cand.length)return null;
 let best=null;for(let t=0;t<Math.min(12,cand.length);t++){const r=cand[Math.floor(rnd()*cand.length)];const rs=day.map(([id],j)=>j===i?r:R.find(x=>x.id===id));const tu=tuneDay(cx,rs);if(!best||tu.sc<best.tu.sc)best={rs,tu};}
 const days=plan.days.map(L=>L.slice());days[d]=best.rs.map((r,j)=>[r.id,Math.round(best.tu.q[j]*ppl*100)/100]);return summarize(R,price,Object.assign({},plan,{days}));}
function summarize(R,price,plan){const ppl=plan.people||1;let cost=0,k=0,p=0,maxDev=0;const T=plan.opts&&plan.opts.kcal;
 plan.days.forEach(L=>{let dk=0;L.forEach(([id,q])=>{const r=R.find(x=>x.id===id);if(!r)return;const per=r.ing.reduce((t,[n,qq,u])=>t+((price[n+"|"+u])||0)*qq,0)/r.serv;cost+=per*q;dk+=r.cal*q/ppl;p+=r.p*q/ppl;});k+=dk;if(T)maxDev=Math.max(maxDev,Math.abs(dk-T)/T);});
 return Object.assign(plan,{cost,kcal:k/7,p:p/7,maxDev,budgetOk:!(plan.opts&&plan.opts.budget)||cost<=plan.opts.budget+0.01});}
const API={gen,swap,summarize,flags,okDiet,DIETS,slotsFor,protTarget};
if(typeof module!=="undefined"&&module.exports)module.exports=API;else root.PG=API;
})(this);
