// Builds 50 ready-made weekly plans with the same generator the app uses (js/plangen.js). Deterministic.
// node tools/build-plans.js → rewrites `const PLANS=` in index.html
const fs=require('fs'),PG=require('../js/plangen.js');const F=__dirname+'/../index.html';let s=fs.readFileSync(F,'utf8');
const R=eval(s.match(/const RECIPES=(\[.*?\]);\n/s)[1]);const PRICE=eval('('+s.match(/const PRICE=(\{.*?\});/s)[1]+')');
const P=(id,cat,e,name,desc,o,x={})=>({id,cat,e,name,desc,o,...x});
const DEF=[
// Budget (10)
P('b45','Budget','🪙','Under $45 / week','The cheapest healthy week we can build: oats, beans, rice, eggs.',{kcal:1800,budget:45}),
P('b50','Budget','💵','Under $50 / week','Cheap staples, big batches. A whole week for one under $50.',{kcal:2000,budget:50},{free:true}),
P('b60','Budget','💳','Under $60 / week','More variety and protein, still under $60.',{kcal:2100,budget:60}),
P('stud','Budget','🎓','Student ~$45 / week','Dorm-friendly and cheap, about $45 for the week.',{kcal:1800,budget:46}),
P('bveg','Budget','🥕','Budget Vegetarian','Meat-free and wallet-friendly, under $55.',{kcal:2000,budget:55,diet:'veg'}),
P('bhp','Budget','💪','Budget High Protein','~140 g protein a day for under $65.',{kcal:2100,budget:65,goal:'hp'}),
P('bpesc','Budget','🐟','Budget Pescatarian','Fish and plants on a $65 budget.',{kcal:2000,budget:65,diet:'pesc'}),
P('blowc','Budget','🥩','Budget Lower Carb','Lower-carb picks for about $70.',{kcal:1900,budget:70,diet:'lowc'}),
P('bdf','Budget','🥛','Budget Dairy-free','No dairy, under $60.',{kcal:2000,budget:60,diet:'dairyFree'}),
P('b3m','Budget','🍽️','Budget 3 Meals, No Snacks','Just breakfast, lunch and dinner, under $50.',{kcal:1800,budget:50,mpd:3}),
// Goal (14)
P('l14','Goal','⚖️','Lose · 1,400 kcal','Small, filling, high-fiber portions at ~1,400 kcal.',{kcal:1400,goal:'lose'}),
P('l15','Goal','⚖️','Lose · 1,500 kcal','A gentle deficit at ~1,500 kcal with lots of protein.',{kcal:1500,goal:'lose'}),
P('l16','Goal','⚖️','Lose · 1,600 kcal','Filling meals at about 1,600 kcal a day.',{kcal:1600,goal:'lose'}),
P('l18','Goal','⚖️','Lose · 1,800 kcal','Steady weight loss for bigger appetites.',{kcal:1800,goal:'lose'}),
P('l20','Goal','⚖️','Lose · 2,000 kcal','A mild deficit for active people.',{kcal:2000,goal:'lose',mpd:5}),
P('m20','Goal','🎯','Maintain · 2,000 kcal','Balanced everyday eating at 2,000 kcal.',{kcal:2000}),
P('m22','Goal','🎯','Maintain · 2,200 kcal','Balanced meals and snacks at 2,200 kcal.',{kcal:2200}),
P('m25','Goal','🎯','Maintain · 2,500 kcal','For active days and bigger frames.',{kcal:2500,mpd:5}),
P('g26','Goal','📈','Gain · 2,600 kcal','A lean surplus with extra snacks.',{kcal:2600,goal:'gain',mpd:5}),
P('g28','Goal','🏋️','Muscle Gain · 2,800 kcal','Bigger portions and ~175 g protein.',{kcal:2800,goal:'gain',mpd:5}),
P('g32','Goal','🏋️','Bulk · 3,200 kcal','A big-eater week at 3,200 kcal.',{kcal:3200,goal:'gain',mpd:5}),
P('hp18','Goal','💪','High Protein · 1,800','Cut with ~155 g protein to keep muscle.',{kcal:1800,goal:'hp'}),
P('hp22','Goal','💪','High Protein · 2,200','~190 g protein, still balanced.',{kcal:2200,goal:'hp'},{free:true}),
P('hp26','Goal','💪','High Protein · 2,600','For lifters: ~225 g protein.',{kcal:2600,goal:'hp',mpd:5}),
// Diet (16)
P('v16','Diet','🥦','Vegetarian · 1,600','Meat-free and lighter.',{kcal:1600,diet:'veg',goal:'lose'}),
P('v20','Diet','🥦','Vegetarian · 2,000','Eggs, dairy, beans, tofu and lentils.',{kcal:2000,diet:'veg'}),
P('v24','Diet','🥦','Vegetarian · 2,400','Hearty meat-free week.',{kcal:2400,diet:'veg',mpd:5}),
P('vhp','Diet','🌱','Vegetarian High Protein','Tofu, tempeh, Greek yogurt and eggs, ~130 g protein.',{kcal:2200,diet:'veg',goal:'hp'}),
P('p18','Diet','🐟','Pescatarian · 1,800','Fish, seafood and plants.',{kcal:1800,diet:'pesc'}),
P('p22','Diet','🐟','Pescatarian · 2,200','More fish, more omega-3s.',{kcal:2200,diet:'pesc'}),
P('lc16','Diet','🥩','Lower Carb · 1,600','~120 g carbs a day.',{kcal:1600,diet:'lowc',goal:'lose'}),
P('lc19','Diet','🥩','Lower Carb · 1,900','~140 g carbs a day.',{kcal:1900,diet:'lowc'}),
P('lc22','Diet','🥩','Lower Carb · 2,200','~165 g carbs, high protein.',{kcal:2200,diet:'lowc',goal:'hp'}),
P('df18','Diet','🥛','Dairy-free · 1,800','No milk, cheese or yogurt.',{kcal:1800,diet:'dairyFree'}),
P('df22','Diet','🥛','Dairy-free · 2,200','Dairy-free with plenty of protein.',{kcal:2200,diet:'dairyFree'}),
P('np20','Diet','🚫','No Pork · 2,000','Chicken, turkey, beef, fish and plants.',{kcal:2000,diet:'noPork'}),
P('q18','Diet','⏱️','Quick 20-min · 1,800','Hands-on cooking about 20 minutes or less.',{kcal:1800,quick:true}),
P('q22','Diet','⏱️','Quick 20-min · 2,200','Fast meals for busy weeks.',{kcal:2200,quick:true}),
P('qveg','Diet','⏱️','Quick Vegetarian','Fast and meat-free.',{kcal:2000,quick:true,diet:'veg'}),
P('two','Diet','🍱','Two Meals a Day','Lunch and dinner only, bigger plates.',{kcal:1800,mpd:2}),
// Family (10)
P('f2','Family','👫','Couple · 2 people','Cook once for two, 2,000 kcal each.',{kcal:2000,people:2}),
P('f2l','Family','👫','Couple Lose Weight','Two people at 1,600 kcal each.',{kcal:1600,people:2,goal:'lose'}),
P('f3','Family','👨‍👩‍👦','Family of 3','Everyday family dinners for three.',{kcal:2000,people:3}),
P('f4b','Family','👨‍👩‍👧‍👦','Budget Family of 4','Kid-friendly batches, about $190 for four.',{kcal:1900,people:4,budget:190}),
P('f4','Family','👨‍👩‍👧‍👦','Family of 4','Balanced variety for four.',{kcal:2000,people:4}),
P('f4v','Family','🥦','Vegetarian Family of 4','Meat-free week for four.',{kcal:1900,people:4,diet:'veg'}),
P('f4q','Family','⏱️','Busy Family of 4','Quick weeknight cooking for four.',{kcal:1900,people:4,quick:true}),
P('f4hp','Family','💪','Active Family of 4','High protein for sporty families.',{kcal:2200,people:4,goal:'hp'}),
P('f5','Family','👨‍👩‍👧‍👦','Family of 5','Big batches for five, about $245.',{kcal:1900,people:5,budget:245}),
P('f6b','Family','🏠','Budget Family of 6','Feeds six for about $270.',{kcal:1800,people:6,budget:270}),
];
const avoid={};const out=[];const sigs=new Set();
DEF.forEach((d,i)=>{let p=null;for(let s=1;s<6;s++){p=PG.gen(R,PRICE,{...d.o,avoid,avoidW:.25,restarts:6,iters:600},1000+i*13+s);const sig=[...new Set(p.days.flat().map(x=>x[0]))].sort().join();if(!sigs.has(sig)){sigs.add(sig);break;}}
 if(p.error)throw new Error(d.id+' '+p.error);p.days.flat().forEach(([id])=>avoid[id]=(avoid[id]||0)+1/7);
 console.log(d.id.padEnd(5),d.cat.padEnd(6),'$'+p.cost.toFixed(0).padStart(4),'kcal',Math.round(p.kcal),'P',Math.round(p.p),'/',p.protTarget,'dev',(p.maxDev*100).toFixed(1)+'%',p.budgetOk?'':'OVER '+d.o.budget,p.notes.join(' '));
 out.push({id:d.id,cat:d.cat,e:d.e,name:d.name,desc:d.desc,kcal:d.o.kcal,people:d.o.people||1,budget:d.o.budget||null,free:!!d.free,opts:{mpd:4,people:1,diet:'any',goal:'maintain',...d.o},days:p.days});});
console.log(out.length,'plans,',sigs.size,'distinct');
const J='const PLANS='+JSON.stringify(out)+';';s=s.replace(/const PLANS=\[.*?\];/s,()=>J);fs.writeFileSync(F,s);
