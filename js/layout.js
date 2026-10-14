/* Today layout: hero ring + 3 bubbles, meal carousel, FAB menu */
(function(){const T=$("tab-today"),hero=T.querySelector(".hero");
 const mt=hero.querySelector(".mxtop");mt.classList.add("lmtop");const ring=$("ring");ring.style.width="210px";ring.style.height="210px";
 const bub=document.createElement("div");bub.className="lmbub";bub.id="lmBub";mt.after(bub);
 // meals header + carousel
 const sect=$("meals").previousElementSibling;sect.classList.add("lmsect");
 // FAB menu
 const fab=$("fab");fab.setAttribute("aria-label","Add");const m=document.createElement("div");m.id="lmMenu";m.innerHTML=`<div class="lmsh"></div><div class="lmgrid">
 <button data-a="food"><i style="background:linear-gradient(135deg,#e9b862,#c87b2c)">🍽️</i><b>Log food</b><small>Search, recent, favorites</small></button>
 <button data-a="scan"><i style="background:linear-gradient(135deg,#7fb6e9,#3b6fc8)">📷</i><b>Scan</b><span class="lmscan"><span data-sc="photo">📷 Photo</span><span data-sc="bar"><svg class="lic" viewBox="0 0 24 24"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M18 5v14M21 5v14"/></svg>Barcode</span></span></button>
 <button data-a="burn"><i style="background:linear-gradient(135deg,#8fdc9a,#3e9b52)">🔥</i><b>Workout</b><small>Add calories burned</small></button>
 <button data-a="fridge"><i style="background:linear-gradient(135deg,#9fe3e8,#3a9aa8)">🧊</i><b>Fridge Rescue</b><small>Use what you have</small></button></div>`;
 document.body.append(m);const tog=o=>{document.body.classList.toggle("lmopen",o);fab.innerHTML=o?'<svg class="lic" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>':'<svg class="lic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';};
 fab.onclick=()=>tog(!document.body.classList.contains("lmopen"));m.querySelector(".lmsh").onclick=()=>tog(false);
 m.querySelectorAll("[data-a]").forEach(b=>b.onclick=(ev)=>{tog(false);const sc=ev.target.closest("[data-sc]");if(b.dataset.a==="scan"&&sc&&sc.dataset.sc==="bar"){openScan();return;}({food:()=>$("addBtn").onclick(),scan:()=>$("snapBtn").click(),burn:()=>openBurn(),fridge:()=>openFridge()})[b.dataset.a]();});
 const rt=window.renderToday;window.renderToday=renderToday=function(){rt.apply(this,arguments);try{
  bn=burnOf(cur),b=+S.budget||0,ws=weekSpend().t;
  $("lmBub").innerHTML=`<div><i>⚡</i><b>${calcStreak()}<small> days</small></b><span>Streak</span></div><div><i>💵</i><b>${b?"$"+Math.max(0,b-ws).toFixed(0):"$"+ws.toFixed(0)}</b><span>${b?"Budget left":"Spent this week"}</span></div><div><i>🔥</i><b>${bn.toLocaleString()}</b><span>Burned</span></div>`;{const bd=$("lmBub").children[1];if(bd&&typeof goBudget==="function"){bd.style.cursor="pointer";bd.setAttribute("role","button");bd.setAttribute("aria-label","Edit weekly budget");bd.onclick=goBudget;}}
  document.querySelectorAll("#meals details.meal").forEach(d=>d.open=true);}catch(e){console.warn(e)}};
 renderToday();})();
