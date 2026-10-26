/* Launch fixes: Today meal carousel auto-scroll, readable swipe hints. */
(function(){
 const mr=$("meals");if(!mr)return;
 let touched=false,lastDay=null;
 ["pointerdown","touchstart","wheel","keydown"].forEach(ev=>mr.addEventListener(ev,()=>{touched=true;},{passive:true}));
 const hourMeal=()=>{const h=new Date().getHours();return h<10?"Breakfast":h<15?"Lunch":h<21?"Dinner":"Snacks";};
 function targetMeal(){
  const d=S.days&&S.days[cur],es=(d&&d.entries)||[],has=m=>es.some(e=>e.meal===m);
  if(cur===ymd(new Date()))return hourMeal();
  return MEALS.find(has)||MEALS[0];}
 function autoMeal(){
  if(lastDay!==cur){lastDay=cur;touched=false;}
  if(touched)return;
  const el=mr.querySelector(`[data-m="${targetMeal()}"]`),first=mr.querySelector("[data-m]");if(!el||!first)return;
  const go=()=>{if(touched)return;mr.scrollTo({left:Math.max(0,el.offsetLeft-first.offsetLeft),behavior:"instant"});};
  go();requestAnimationFrame(go);}
 const rt=window.renderToday;window.renderToday=renderToday=function(){rt.apply(this,arguments);try{autoMeal();}catch(e){console.warn(e);}};
 // swipe hints
 const fy=document.querySelector(".mxsect small");if(fy){fy.className="pjhint";fy.textContent="Swipe for more ›";}
 try{autoMeal();}catch(e){}
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!touched)try{autoMeal();}catch(e){}});
})();
