/* Accent color: recolors ring, buttons, + and active tab. Stored as S.accent. */
const ACCENTS={orange:["Orange","#ff8a2a","#c4520f"],red:["Red","#ff5a52","#b3261e"],blue:["Blue","#4ea1ff","#1f5fbf"],green:["Green","#3fd47a","#1e8c4a"],steel:["Steel","#b4c3d3","#5d6d7e"],gold:["Gold","#f2c14e","#b8862b"]};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(",");
const BG2ACC={brown:"orange",espresso:"gold",olive:"green",terracotta:"red",navy:"blue"};
/* old background choice maps to a matching accent until the user picks one */
function accentKey(){if(ACCENTS[S.accent])return S.accent;return BG2ACC[S.bg]||"orange";}
function applyAccent(){const [,a,b]=ACCENTS[accentKey()],st=document.documentElement.style;st.setProperty("--acc",a);st.setProperty("--acc2",b);st.setProperty("--accrgb",rgb(a));st.setProperty("--acc2rgb",rgb(b));
 const tc=document.querySelector('meta[name="theme-color"]');if(tc)tc.content="#121417";}
function accentHTML(){const k=accentKey();return Object.entries(ACCENTS).map(([id,[n,a,b]])=>`<button type="button" class="acsw${id===k?" on":""}" data-acc="${id}"><i style="background:linear-gradient(135deg,${a},${b})"></i><span>${n}</span></button>`).join("");}
function setAccent(id){S.accent=id;save();applyAccent();document.querySelectorAll(".acgrid").forEach(g=>g.innerHTML=accentHTML());try{renderToday()}catch(e){}}
function mountAccent(){const bp=$("bgPick");if(bp&&!$("acSet")){const card=bp.closest(".card");card.innerHTML=`<h2>Accent color</h2><div class="acgrid" id="acSet"></div><p class="muted" style="font-size:.8rem;margin:12px 0 0">Colors the calorie ring, buttons, the + button and the active tab.</p><div id="bgPick" style="display:none"></div>`;}
 const ot=$("oTheme");if(ot&&!ot.classList.contains("acgrid")){ot.classList.add("acgrid");const lab=ot.previousElementSibling;if(lab&&/theme/i.test(lab.textContent))lab.textContent="Accent color";}
 document.querySelectorAll(".acgrid").forEach(g=>{g.innerHTML=accentHTML();g.onclick=g._acClick=e=>{const b=e.target.closest("[data-acc]");if(!b)return;e.stopPropagation();setAccent(b.dataset.acc);};});}

document.addEventListener("DOMContentLoaded",()=>{applyAccent();mountAccent();const ot=$("oTheme");if(ot)new MutationObserver(()=>{if(!ot.querySelector(".acsw"))mountAccent();else if(ot.onclick&&!ot._ac){}}).observe(ot,{childList:true});});
