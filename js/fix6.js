/* fix6 mockup: Insights weight empty state */
(function(){const $=id=>document.getElementById(id);
const orig=window.renderWeight;if(typeof orig!=="function")return;
window.renderWeight=function(){const r=orig.apply(this,arguments);try{const empty=!Object.keys(S.weights||{}).length;
 ["wtChart","wtLegend","wtStats","wtProg"].forEach(i=>{const e=$(i);if(e)e.style.display=empty?"none":"";});const d=$("wtDate");if(d&&d.parentElement)d.parentElement.style.display=empty?"none":"";
 $("wtEmpty").style.display=empty?"flex":"none";}catch(e){}return r;};
$("wtEmptyGo").onclick=()=>{const i=$("wtIn");i.scrollIntoView({block:"center",behavior:"smooth"});setTimeout(()=>i.focus(),250);};
try{renderWeight();}catch(e){}
})();
