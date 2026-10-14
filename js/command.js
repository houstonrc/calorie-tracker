/* Command Center: current-week day strip */
(function(){const T=$("tab-today"),hero=T.querySelector(".hero");
 const box=document.createElement("div");box.id="cmd";box.innerHTML='<div class="cmh"><b>Command Center</b><small>This week</small></div><div class="cmrow" id="cmRow"></div>';T.insertBefore(box,T.firstElementChild);
 const I=(d)=>`<svg class="lic" viewBox="0 0 24 24"><path d="${d}"/></svg>`;
 const FL="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",DL="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6";
 const DOWS=["SUN","MON","TUE","WED","THU","FRI","SAT"];
 function draw(){const now=new Date(),td=ymd(now),st=new Date(now);st.setDate(now.getDate()-((now.getDay()+6)%7));const ks=[];for(let i=0;i<7;i++){const d=new Date(st);d.setDate(st.getDate()+i);ks.push(ymd(d));}
  $("cmRow").innerHTML=ks.map(k=>{const d=parse(k),t=totals(k),g=goalFor(k),pct=g?Math.min(100,t.cal/g*100):0,over=g&&t.cal>g,sp=day(k).entries.reduce((a,e)=>a+entryCost(e),0),bn=burnOf(k),fut=k>td;
   return `<button type="button" class="cmt${k===td?" today":""}${k===cur?" sel":""}${fut?" fut":""}" data-k="${k}"><span class="cmd">${DOWS[d.getDay()]} <i>${d.getDate()}</i></span>
   <span class="cmc"><b>${t.n?Math.round(t.cal).toLocaleString():"–"}</b><small>/ ${g?g.toLocaleString():"–"}</small></span><span class="cmbar"><i class="${over?"ov":""}" style="width:${pct}%"></i></span>
   <span class="cmm">${I(DL)}${sp?sp.toFixed(2):"0"}</span><span class="cmm">${I(FL)}${bn}</span></button>`;}).join("");
  const sel=$("cmRow").querySelector(".sel")||$("cmRow").querySelector(".today");if(sel){const r=$("cmRow");r.scrollLeft=Math.max(0,sel.offsetLeft-r.offsetLeft-(r.clientWidth-sel.offsetWidth)/2);}}
 $("cmRow").onclick=e=>{const b=e.target.closest("[data-k]");if(!b||b.dataset.k===cur)return;const n=Math.round((parse(b.dataset.k)-parse(cur))/864e5);shift(n);};
 const rt=window.renderToday;window.renderToday=renderToday=function(){rt.apply(this,arguments);try{draw()}catch(e){console.warn(e)}};renderToday();})();
