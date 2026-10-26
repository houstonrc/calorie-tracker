/* PlateJack food search ranking. Lower score = higher in the list. Nothing is hidden, results are only reordered.
   Rules, in order:
   1. Match quality: name is the query (0), first part of the name is the query ("Rice, white, cooked") (1),
      first two parts are the query ("Beef, ground, ...") (1.5), name starts with the query ("Rice crackers") (2),
      query words in the first two parts (2.5), query words anywhere (3), letters only inside another word (4).
   2. Boost basic forms: raw, cooked, plain, whole, fresh, boiled, steamed, roasted, grilled, baked (-0.6);
      dry / uncooked / unprepared forms sit below the cooked ones (+1).
   3. Push down: baby food / infant (+5), tribal or regional tags like "(Navajo)" (+4), unusual source animal (+2),
      made-from words not in the query such as flour, bran, crackers, pudding, juice (+1.2),
      fast food / restaurant / chain names in capitals (+1.5), branded entries (+1 in the USDA list, +0.3 in Open Food Facts;
      generic USDA Foundation / SR Legacy -0.5).
      first part of the name is a different food ("Oil, oat" for oats) (+1).
   4. Brand mismatch: a branded entry whose name is just the query, but whose brand names a different food
      (e.g. "Banana" by a peanut butter brand), or whose calories per 100 g are more than 2x off the top generic
      USDA match AND whose protein/carb/fat mix is clearly different (e.g. a candy sold as "Eggs") (+3).
   Ties keep the shorter name first. */
(function(){
const stem=w=>w.length>3&&/s$/.test(w)&&!/ss$/.test(w)?w.slice(0,-1):w;
const words=s=>(String(s||"").toLowerCase().match(/[a-z0-9%']+/g)||[]).map(stem);
const same=(a,b)=>{const A=new Set(a),B=new Set(b);if(A.size!==B.size)return false;for(const x of A)if(!B.has(x))return false;return true;};
const hasAll=(need,have)=>{const H=new Set(have);return need.every(w=>H.has(w));};
const BASIC=/\b(raw|cooked|plain|whole|fresh|boiled|steamed|roasted|grilled|baked)\b/;
const DERIV=["flour","bran","cracker","cake","noodle","powder","dehydrated","dried","chip","bar","pudding","oil","chocolate","vanilla","strawberry","sweetened","condensed","evaporated","buttermilk","juice","sauce","soup","muffin","cookie","candie","candy","pie","smoothie","shake","flavored","dessert","syrup","substitute","imitation","spread","dressing","pancake","waffle","nectar","drink","beverage","mix","bread","crumb","stick","roll","sandwich","burrito","taco","pizza","salad","casserole"];
const BABY=/\b(baby ?foods?|infant|toddler)\b/;
const TRIBAL=/\b(navajo|hopi|apache|shoshone|bannock|alaska native|inupiat|yupik|northern plains|southwest|indians|native american|tribal|eskimo)\b/;
const ODD=["human","sheep","goat","buffalo","camel","mare","caribou","moose","bison","emu","ostrich","seal","whale","walrus","beaver","bear","squirrel"];
const CHAIN=/^(fast foods?|restaurant)\b/;
const BRANDFOOD=/\b(peanut butter|chocolate|candy|cookie|cracker|chips|sauce|dressing|juice|cereal|bar|craisins|smoothie|snack|syrup|spread)\b/;
function score(f,q,ctx){const n=String(f.name||""),lc=n.toLowerCase(),qW=words(q);if(!qW.length)return 9;
 const segs=lc.split(","),nW=words(n),hW=words(segs[0]),h2W=words(segs.slice(0,2).join(" "));
 let s;
 if(same(nW,qW))s=0;else if(same(hW,qW))s=1;else if(same(h2W,qW))s=1.5;
 else if(qW.every((w,i)=>nW[i]===w))s=2;else if(hasAll(qW,h2W))s=2.5;else if(hasAll(qW,nW))s=3;else s=4;
 const inQ=w=>qW.includes(stem(w));
 if(BASIC.test(lc))s-=0.6;
 if(/\b(dry|uncooked|unprepared)\b/.test(lc))s+=1;
 if(BABY.test(lc)&&!BABY.test(q.toLowerCase()))s+=5;
 if(TRIBAL.test(lc)&&!TRIBAL.test(q.toLowerCase()))s+=4;
 if(ODD.some(w=>nW.includes(stem(w))&&!inQ(w)))s+=2;
 if(!qW.some(w=>hW.includes(w)))s+=1;
 if(DERIV.some(w=>nW.includes(stem(w))&&!inQ(w)))s+=1.2;
 if((CHAIN.test(lc)&&!CHAIN.test(q.toLowerCase()))||/(^|,\s*)[A-Z][A-Z'.&\- ]{2,}(,|$)/.test(n)&&f.src==="sr")s+=1.5;
 const branded=f.src==="off"||f.kind==="Branded"||!!f.brand;
 const nameIsQuery=s<=0.6;
 if(f.src==="usda")s+=branded?1:-0.5;else if(f.src==="off")s+=0.3;
 if(branded&&nameIsQuery){const b=String(f.brand||"").toLowerCase(),bf=b.match(BRANDFOOD);
  if((bf&&!q.toLowerCase().includes(bf[1]))||unlike(f.per,ctx&&ctx.ref))s+=3;}
 return s+lc.length/200;}
function mix(per){const p=+per.p||0,c=+per.c||0,fa=+per.f||0,t=p*4+c*4+fa*9;return t>0?[p*4/t,c*4/t,fa*9/t]:null;}
function unlike(per,ref){if(!per||!ref||!(per.cal>0)||!(ref.cal>0))return false;const r=per.cal/ref.cal,a=mix(per),b=mix(ref);if(!a||!b)return false;
 const dist=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);return (r>2||r<0.5)&&dist>0.6;}
function matches(lc,terms){return terms.every(t=>{if(lc.includes(t))return true;const st=stem(t);return st!==t&&new RegExp("\\b"+st.replace(/[^a-z0-9]/g,"")).test(lc);});}
function rank(list,q,ctx){return (list||[]).map((f,i)=>[score(f,q,ctx),i,f]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[2]);}
function refFood(sr,q){const r=(sr||[]).find(f=>score(f,q,null)<4);return r&&r.per?r.per:null;}
const api={score,rank,matches,refFood,words};
if(typeof window!=="undefined")window.pjRank=api;if(typeof module!=="undefined")module.exports=api;
})();
