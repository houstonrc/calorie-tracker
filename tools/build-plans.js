// Builds the ready-made weekly meal plans (PLANS) from RECIPES + PRICE in index.html.
// Deterministic (seeded). Run: node tools/build-plans.js  → prints summary and rewrites `const PLANS=` in index.html
const fs=require('fs');const F=__dirname+'/../index.html';let s=fs.readFileSync(F,'utf8');
const R=eval(s.match(/const RECIPES=(\[.*?\]);\n/s)[1]);const PRICE=eval('('+s.match(/const PRICE=(\{.*?\});/s)[1]+')');
const per=r=>r.ing.reduce((t,[n,q,u])=>t+(PRICE[n+'|'+u]||0)*q,0)/r.serv;
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const pick=a=>a[Math.floor(rnd()*a.length)];
const M=['Breakfast','Lunch','Dinner'];
const DEF=[
 {id:'hp',e:'💪',name:'High Protein',desc:'Protein-forward meals and snacks, ~150 g protein a day.',kcal:2200,pmin:150,free:true,f:r=>true,wP:3},
 {id:'b50',e:'💵',name:'Under $50 / week',desc:'Cheap staples, big batches. Whole week for one under $50.',kcal:2000,budget:50,free:true,f:r=>true},
 {id:'fam',e:'👨‍👩‍👧‍👦',name:'Budget Family of 4',desc:'Kid-friendly budget batches. Every meal makes 4 servings.',kcal:1900,budget:180,people:4,f:r=>r.tags.includes('Budget')},
 {id:'veg',e:'🥦',name:'Vegetarian',desc:'Meat-free week with eggs, dairy, beans, tofu and lentils.',kcal:2000,f:r=>r.veg},
 {id:'quick',e:'⏱️',name:'Quick 20-min',desc:'Meals with ~20 minutes or less of hands-on cooking.',kcal:2000,f:r=>r.cook<=20&&r.prep<=15},
 {id:'lowc',e:'🥩',name:'Lower Carb',desc:'Lowest-carb picks in the library, ~150 g carbs a day or less.',kcal:1900,cmax:150,f:r=>r.meal==='Snacks'?r.c<=20:r.c<=45},
 {id:'mg',e:'🏋️',name:'Muscle Gain',desc:'Bigger portions and extra snacks, ~2,800 kcal and 170 g+ protein.',kcal:2800,pmin:170,f:r=>true,big:true,wP:2},
 {id:'w16',e:'⚖️',name:'Weight-friendly 1,600',desc:'Filling, high-fiber meals at about 1,600 kcal a day.',kcal:1600,f:r=>r.meal==='Snacks'?r.cal<=180:r.cal<=520,wF:1},
 {id:'stud',e:'🎓',name:'Student ~$40 / week',desc:'Dorm-friendly and cheap: oats, beans, rice, eggs. About $40 for the week.',kcal:1800,budget:40,f:r=>true},
 {id:'nocook',e:'🥪',name:'No-Cook & Lunchbox',desc:'Grab-and-go breakfasts, lunches and snacks; dinners 20 min or less.',kcal:2000,f:r=>r.meal==='Dinner'?r.cook<=20:r.cook===0},
];
const used={};const out=[];
for(const P of DEF){const pool={};[...M,'Snacks'].forEach(m=>pool[m]=R.filter(r=>r.meal===m&&P.f(r)));
 const ppl=P.people||1;let best=null;const SQ=P.budget&&P.budget<40?[1,2,3,4]:[1,2,3];const MQ=P.big?[1.5,2]:[1,1.5];
 const evalS=st=>{let cost=0,dev=0,pg=0,cg=0,fib=0;const days=[];
  for(let d=0;d<7;d++){const h=d<4?0:1;const L=M.map(m=>({r:st.pk[m][h],q:st.mq[m]}));const s1=st.sn[h];
   let cal=L.reduce((a,x)=>a+x.r.cal*x.q,0);let sq=0,bd=1e9;for(const q of SQ){const dd=Math.abs(P.kcal-cal-s1.cal*q);if(dd<bd){bd=dd;sq=q;}}
   if(sq)L.push({r:s1,q:sq});cal=L.reduce((a,x)=>a+x.r.cal*x.q,0);const p=L.reduce((a,x)=>a+x.r.p*x.q,0),c=L.reduce((a,x)=>a+x.r.c*x.q,0);
   fib+=L.reduce((a,x)=>a+x.r.fib*x.q,0);cost+=L.reduce((a,x)=>a+per(x.r)*x.q,0)*ppl;dev+=Math.abs(P.kcal-cal)/P.kcal;
   if(P.pmin)pg+=Math.max(0,P.pmin-p)/P.pmin;if(P.cmax)cg+=Math.max(0,c-P.cmax)/P.cmax;days.push(L);}
  const all=[...M.flatMap(m=>st.pk[m]),...st.sn];const ids=all.map(r=>r.id);const dup=ids.length-new Set(ids).size;const reuse=all.reduce((a,r)=>a+(used[r.id]||0),0);
  const score=dev/7*4+(P.budget&&cost>P.budget*.97?(cost-P.budget*.97)/P.budget*30:0)+(P.budget?cost/P.budget*.15:cost/(70*ppl)*.3)+pg/7*(P.wP||1)*6+cg/7*6+reuse*.04+dup*.5-(P.wF?fib/7/40:0);
  return {score,cost,days,all};};
 const rand=()=>{const pk={};M.forEach(m=>pk[m]=[pick(pool[m]),pick(pool[m])]);const mq={};M.forEach(m=>mq[m]=pick(MQ));return {pk,mq,sn:[pick(pool.Snacks),pick(pool.Snacks)]};};
 const mut=st=>{const n=JSON.parse(JSON.stringify({mq:st.mq}));n.pk={};M.forEach(m=>n.pk[m]=[...st.pk[m]]);n.sn=[...st.sn];const k=Math.floor(rnd()*8);
  if(k<6){const m=M[k>>1];n.pk[m][k&1]=pick(pool[m]);}else if(k===6)n.sn[Math.floor(rnd()*2)]=pick(pool.Snacks);else n.mq[pick(M)]=pick(MQ);return n;};
 for(let rs=0;rs<40;rs++){let st=rand(),e=evalS(st);for(let it=0;it<1500;it++){const n=mut(st),f=evalS(n);if(f.score<=e.score){st=n;e=f;}}if(!best||e.score<best.score)best=e;}
 best.all.forEach(r=>used[r.id]=(used[r.id]||0)+1);
 const days=best.days.map(L=>L.map(x=>[x.r.id,x.q*(P.people||1)]));
 const st=best.days.map(L=>[L.reduce((a,x)=>a+x.r.cal*x.q,0),L.reduce((a,x)=>a+x.r.p*x.q,0),L.reduce((a,x)=>a+x.r.c*x.q,0)]);
 console.log(P.id.padEnd(7),'$'+best.cost.toFixed(2).padStart(6),'kcal',st.map(x=>Math.round(x[0])).join('/'),'P',st.map(x=>Math.round(x[1])).join('/'),'C',Math.round(st.reduce((a,x)=>a+x[2],0)/7),[...new Set(best.all.map(r=>r.id))].join(','));
 out.push({id:P.id,e:P.e,name:P.name,desc:P.desc,kcal:P.kcal,people:P.people||1,budget:P.budget||null,free:!!P.free,days});}
const J='const PLANS='+JSON.stringify(out)+';';
s=/const PLANS=\[.*?\];/s.test(s)?s.replace(/const PLANS=\[.*?\];/s,()=>J):s.replace('const PCRED=',()=>J+'\nconst PCRED=');
fs.writeFileSync(F,s);
