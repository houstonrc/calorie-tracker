/* v63 mockup: walkthrough fixes (Pro badges + explainer, merged erase, fridge ideas, swipe hints, photo credits, food DB, misc). */
(function(){
const $=id=>document.getElementById(id),q=s=>document.querySelector(s);
const PRO='<em class="probadge">PRO</em>';
const LK='<svg class="lic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const pro=()=>typeof isPro==="function"&&isPro();

/* ---- 1 + 10: short explanation before the paywall ---- */
const WHY={scan:["Barcode scanner","Barcode scanning is free. If you see this, reload the app."],
 plan:["Planner and grocery list","The planner and grocery list are free. If you see this, reload the app."],
 plans:["Ready-made plans","All ready-made plans are free."],
 gen:["You've used this week's free custom plan","Build my plan makes 1 custom plan a week for free. You can still use any ready-made plan. Unlimited custom plans are coming with PlateJack Pro."],
 prep:["Recipes","Every recipe is free."],
 coach:["Full Jack Coach is coming with Pro","You get a free tip every day. Pro will add smart tips based on your log and budget."],
 fridge:["Fridge Rescue","Fridge Rescue is free."],
 insights:["Full Insights are coming with Pro","7-day charts are free. Pro will add 30 and 90-day trends, the nutrient table and goal weight projection."],
 report:["More Plate Report styles are coming with Pro","The Classic Plate Report is free. Pro will add Bold and Paper styles and remove the watermark."],
 budget:["Budget Mode is coming with Pro","Cost per serving and grocery totals are free. Pro will add editable ingredient prices and \u201cbuild a week under $X\u201d auto-plans."],
 snap:["More photo scans are coming with Pro","Free includes 3 photo scans a day. Pro will add more."],
 theme:["Colors","Every accent color is free."]};
document.body.insertAdjacentHTML("beforeend",`<dialog id="whyDlg"><div class="whyi">${LK}</div><h2 id="whyT"></h2><p id="whyP"></p><button type="button" id="whyX">OK</button><button type="button" class="ghost" id="whyGo">What\u2019s coming in Pro</button></dialog>`);
const _op=window.openPay;let pend=null;
window.openPay=openPay=function(why){const w=WHY[why];if(!w||pro()){_op(why);return;}pend=why;$("whyT").textContent=w[0];$("whyP").textContent=w[1];$("whyDlg").showModal();};
$("whyGo").onclick=()=>{$("whyDlg").close();_op(pend);};$("whyX").onclick=()=>$("whyDlg").close();
$("whyDlg").addEventListener("click",e=>{if(e.target===$("whyDlg"))$("whyDlg").close();});

/* ---- 1: PRO badge on Barcode (+ menu); 10: badges on locked Plan segments ---- */
const can=f=>typeof canUse==="function"?canUse(f):pro();
function badges(){
 const bar=q('#lmMenu [data-sc="bar"]');if(bar){bar.querySelector(".probadge")?.remove();if(!can("barcode"))bar.insertAdjacentHTML("beforeend",PRO);}
 document.querySelectorAll('#planSeg [data-v="plan"],#planSeg [data-v="grocery"]').forEach(b=>{b.querySelector(".probadge")?.remove();if(!can(b.dataset.v==="grocery"?"grocery":"planner"))b.insertAdjacentHTML("beforeend",PRO);});}
badges();const _rs=typeof renderSettings==="function"?renderSettings:null;setInterval(badges,1500);

/* ---- 3: one erase flow. Export/Import move to Account & Data; old erase button removed ---- */
(function mv(){const w=$("wipe");if(w)w.remove();const dc=$("delCard");if(!dc){setTimeout(mv,200);return;}if($("bkCard"))return;const grp=dc.previousElementSibling;
 const card=document.createElement("div");card.className="card";card.id="bkCard";
 card.innerHTML=`<b style="display:block;margin-bottom:4px">Backup</b><p class="muted" id="bkTxt" style="font-size:.85rem;margin:0 0 10px">${typeof sbUser!=="undefined"&&sbUser?"Your log syncs to your account. A backup file is still handy to keep your own copy.":"Without an account your data lives on this device only. Export a backup now and then."}</p><div class="bkgrid"></div>`;
 const g=card.querySelector(".bkgrid");["expJson","expCsv","impBtn"].forEach(id=>{const b=$(id);if(b)g.append(b);});const f=$("impFile");if(f)card.append(f);
 const h=document.createElement("div");h.className="grp";h.textContent="Data";grp.before(h,card);
 const pg=q('.sp[data-p="data"]');if(pg)pg.remove();
 const t=q('.sp[data-p="acct"] .sphead h1');if(t)t.textContent="Account & Data";})();

/* ---- 9: Quick add from Today picks the meal by time of day ---- */
$("quickBtn").onclick=()=>{let keep;try{keep=selMeal;selMeal=null;}catch(e){}openDlg("quick");try{selMeal=keep;}catch(e){}};

/* ---- 7: Fridge sheet shows ideas too ---- */
(function(){const list=$("frList");if(!list)return;const box=document.createElement("div");box.id="frIdeas";list.after(box);
 const paint=()=>{if(typeof frSuggest!=="function")return;const L=FR();if(!L.length){box.innerHTML="";return;}const all=frSuggest(),n=can("fridgeAll")?3:1,sh=all.slice(0,n);box._s=sh;
  box.innerHTML=`<div class="frit">Ideas from your fridge</div>`+(sh.length?sh.map((s,i)=>`<div class="frs"><img class="frth" src="${s.r.img?"img/r/"+s.r.img+"-t.webp":"img/r/"+s.r.id+"-t.webp"}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span class="n"><b>${esc(s.r.name)}</b><small>${esc(s.why)} · ${s.r.cal} cal</small></span><button class="small" data-fi="${i}">Log it</button></div>`).join("")
  +(!can("fridgeAll")&&all.length>1?`<button class="ghost small frmore" data-fp="1">${Math.min(all.length,3)-1} more idea${Math.min(all.length,3)-1==1?"":"s"} with Pro ${PRO}</button>`:""):`<div class="muted" style="font-size:.85rem">${typeof frEmptyMsg==="function"?frEmptyMsg():""}</div>`);};
 box.onclick=e=>{const b=e.target.closest("[data-fi]");if(b){frUse(box._s[+b.dataset.fi]);paint();return;}if(e.target.closest("[data-fp]"))openPay("fridge");};
 const _rf=renderFridge;window.renderFridge=renderFridge=function(){_rf.apply(this,arguments);paint();};})();

/* ---- 14: Food database page: plain wording, own key tucked under Advanced ---- */
(function(){const k=$("usdaKey");if(!k)return;const card=k.closest(".card");const lab=card.querySelector('label[for="usdaKey"]'),sv=$("usdaKeySave");
 const adv=document.createElement("details");adv.className="pjadv";adv.open=!!k.value;adv.innerHTML=`<summary>Advanced</summary><p class="muted" style="font-size:.82rem;margin:8px 0">Searching a lot? You can add your own free USDA search key from <a href="https://fdc.nal.usda.gov/api-key-signup" target="_blank" rel="noopener">api.data.gov</a>. It stays on this device. Most people never need this.</p>`;
 lab.before(adv);adv.append(lab,k,sv);if(lab)lab.textContent="Your own USDA search key";
 const p=card.querySelector("p.muted");if(p)p.innerHTML=`Food search looks up the USDA food database and Open Food Facts for packaged foods. It works out of the box, no setup needed.`;
 const h=card.querySelector("h2");if(h)h.textContent="Food search";})();

/* ---- 15: swipe rows get a peek fade + dots ---- */
function dots(row){if(!row||row._dots)return;row._dots=1;const d=document.createElement("div");d.className="swdots";row.after(d);
 const kids=()=>[...row.children].filter(c=>c.offsetParent!==null&&c.getBoundingClientRect().width>0);
 const up=()=>{const K=kids();if(K.length<2){d.innerHTML="";row.classList.remove("swfade","swend");return;}const i=Math.round(row.scrollLeft/Math.max(1,(row.scrollWidth-row.clientWidth))*(K.length-1));
  d.innerHTML=K.map((_,j)=>`<i class="${j===i?"on":""}"></i>`).join("");const end=row.scrollLeft+row.clientWidth>=row.scrollWidth-4;row.classList.toggle("swfade",!end);row.classList.toggle("swend",end);};
 row.addEventListener("scroll",()=>requestAnimationFrame(up),{passive:true});new MutationObserver(up).observe(row,{childList:true});setTimeout(up,300);up();}
dots(q(".mxrow"));dots($("meals"));

/* ---- 18: Photo credits page in Help ---- */
(function(){const lg=$("hcLegal");if(!lg)return;
 const row=document.createElement("a");row.className="srow";row.href="#";row.id="pcRow";row.innerHTML=`<span><svg class="lic" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/></svg></span><span>Photo credits<small>Who took the food photos and their licenses</small></span><span class="sch">›</span>`;
 const links=lg.querySelectorAll("a.srow");(links[links.length-1]||lg.lastChild).after(row);
 const BG=[["Launch intro: grilling steaks","_BuBBy_ from USA","CC BY 2.0","https://commons.wikimedia.org/wiki/File:Grilling_Steaks.jpg"],["Launch intro: sesame soy glazed salmon","HarshLight","CC BY 2.0","https://commons.wikimedia.org/wiki/File:Sesame_Soy_Glazed_Skuna_Bay_Salmon_-_2.jpg"],["Launch intro: T-bone steak","Shixart1985","CC BY 2.0","https://commons.wikimedia.org/wiki/File:Steak_served_with_sauce_greens_and_garnishes_on_a_dark_plate.jpg"],["Launch intro: grilled chicken","Shixart1985","CC BY 2.0","https://commons.wikimedia.org/wiki/File:Grilled_chicken_with_lemon_and_herbs_served_on_a_dark_platter.jpg"],["Onboarding: meal prep containers","Ella Olsson","CC BY 2.0","https://commons.wikimedia.org/wiki/File:Meal_prep_glass_container_(45165270525).jpg"],
  ["Background: breakfast table","Jakub Żerdzicki","Unsplash License","https://unsplash.com/photos/eEAU_pQxQPA"],["Background: breakfast bowl","Esra Afşar","Unsplash License","https://unsplash.com/photos/Hd4bZ3KWIjo"],["Background: chicken salad","Ani Augustine","Unsplash License","https://unsplash.com/photos/9TogNg01qzI"],["Background: grilled meat","Hanxiao Xu","Unsplash License","https://unsplash.com/photos/aLHhsDbj1Iw"],["Background: bowl of nuts","Metin Ozer","Unsplash License","https://unsplash.com/photos/emgaZL0cGqw"],["Background: fresh produce","Ahmet Koç","Unsplash License","https://unsplash.com/photos/k-Cir8Jnb_Y"],["Background: dumbbells","ajiss (@viktorr_aj)","Unsplash License","https://unsplash.com/photos/xc_uXmo7qBs"],["Background: cashews and fruit","Jonathan Borba","Unsplash License","https://unsplash.com/photos/5iGklOjs0GI"]];
 const lic=l=>/Unsplash/.test(l)?"https://unsplash.com/license":licURL(l);
 document.body.insertAdjacentHTML("beforeend",`<dialog id="pcDlg" class="tall"><div class="shd"><h2>Photo credits</h2><button type="button" class="ghost small" id="pcX">Done</button></div><p class="muted" style="font-size:.85rem">Photos are used under their free licenses. All were cropped, resized and color-graded for PlateJack. Tap a source to see the original.</p><div id="pcList"></div></dialog>`);
 const missing=[];
 const build=()=>{const seen=new Set(),rows=[];(typeof RECIPES!=="undefined"?RECIPES:[]).forEach(r=>{const k=r.img||r.id;const c=PCRED[k];if(!c||!c[0]||!c[1]||!c[3]){missing.push(r.name+" ("+k+")");return;}rows.push([r.name+(seen.has(k)?" (shared photo)":""),c[0],c[1],c[3]]);seen.add(k);});
  $("pcList").innerHTML=`<div class="pcg">Recipes · ${rows.length}</div>`+rows.map(x=>`<div class="pcr"><b>${esc(x[0])}</b><small>${esc(x[1])} · <a href="${lic(x[2])}" target="_blank" rel="noopener">${esc(x[2])}</a> · <a href="${x[3]}" target="_blank" rel="noopener">Source</a></small></div>`).join("")
   +`<div class="pcg">Intro & backgrounds · ${BG.length}</div>`+BG.map(x=>`<div class="pcr"><b>${esc(x[0])}</b><small>${esc(x[1])} · <a href="${lic(x[2])}" target="_blank" rel="noopener">${esc(x[2])}</a> · <a href="${x[3]}" target="_blank" rel="noopener">Source</a></small></div>`).join("");window._pcMissing=missing;};
 row.onclick=e=>{e.preventDefault();build();$("pcDlg").showModal();};$("pcX").onclick=()=>$("pcDlg").close();window._pcBuild=build;})();
})();
