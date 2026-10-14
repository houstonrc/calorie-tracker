/* replace every emoji in the UI with monochrome line icons (Lucide-style). */
(function(){
const P={flame:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",
bell:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",belloff:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0M2 2l20 20",
star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",lock:"M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
dollar:"M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",box:"M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",fridge:"M6 2h12v20H6zM6 10h12M9 5v2M9 13v3",
camera:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8",sparkles:"M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 17v4M17 19h4",
utensils:"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7",cart:"M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6",
check:"M20 6L9 17l-5-5",drop:"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z",chart:"M3 3v18h18M18 17V9M13 17V5M8 17v-3",x:"M18 6L6 18M6 6l12 12",
target:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",scale:"M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8",
share:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",moon:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z",sun:"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4",
pencil:"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z",cal:"M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",timer:"M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
book:"M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5zM20 17v5H6.5A2.5 2.5 0 0 1 4 19.5",user:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
save:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",alert:"M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
dumbbell:"M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11",search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",phone:"M7 2h10v20H7zM12 18h.01",mail:"M2 4h20v16H2zM22 7l-10 6L2 7",
bulb:"M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z",trash:"M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
home:"M3 10l9-7 9 7v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 22V12h6v10",flask:"M9 2h6M10 2v7L4 20a1 1 0 0 0 .9 2h14.2a1 1 0 0 0 .9-2L14 9V2",clock:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
trophy:"M6 9H4a2 2 0 0 1 0-4h2M18 9h2a2 2 0 0 0 0-4h-2M6 3h12v7a6 6 0 0 1-12 0zM12 16v4M8 22h8",clip:"M8 2h8v4H8zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
palette:"M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-2a2 2 0 0 0-1 3.7A2 2 0 0 1 12 22zM7.5 10.5h.01M12 7.5h.01M16.5 10.5h.01",msg:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
file:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",shuffle:"M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",dl:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
refresh:"M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",plus:"M12 5v14M5 12h14",gear:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",help:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
walk:"M13 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M10 22l2-7 3 3v4M7 12l3-4 4 1 3 3M12 15l-2-7",run:"M14 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M5 21l4-6 3 2 1 5M6 11l3-3 4 1 2 4 4 1M9 15l2-7",
bike:"M5.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM18.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2M12 17.5V14l-3-3 4-3 2 3h2",
ball:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2v20M4.9 4.9c4 4 4 10.2 0 14.2M19.1 4.9c-4 4-4 10.2 0 14.2",leaf:"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5.1-6",
zap:"M13 2L3 14h9l-1 8 10-12h-9z",waves:"M2 6c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M2 12c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M2 18c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2",
heart:"M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",hash:"M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
cloud:"M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z",square:"M4 4h16v16H4z",coffee:"M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2"};
const M={"🔥":"flame","🔔":"bell","🔕":"belloff","⭐":"star","★":"star","☆":"star","🔒":"lock","🔑":"lock","💵":"dollar","💸":"dollar","💲":"dollar","🪙":"dollar","💳":"dollar","🥡":"box","🧊":"fridge","📷":"camera","📸":"camera","✨":"sparkles","🎉":"sparkles","👏":"sparkles","🍽":"utensils","🛒":"cart","🛍":"cart","✓":"check","✅":"check","☑":"check","👌":"check","💧":"drop","📊":"chart","📈":"chart","✕":"x","🚫":"x","🎯":"target","⚖":"scale","📤":"share","🌙":"moon","☀":"sun","🌅":"sun","✏":"pencil","✎":"pencil","🗓":"cal","⏱":"timer","📚":"book","📖":"book","🎓":"book","👤":"user","👫":"users","👨‍👩‍👧‍👦":"users","👨‍👩‍👦":"users","👩‍🍳":"users","💾":"save","⚠":"alert","🏋":"dumbbell","💪":"dumbbell","🔍":"search","📱":"phone","💌":"mail","✉":"mail","📬":"mail","🧠":"bulb","🗑":"trash","🧹":"trash","🏠":"home","🔬":"flask","🧪":"flask","🕐":"clock","🕘":"clock","🏆":"trophy","📋":"clip","🎨":"palette","💬":"msg","📄":"file","🔤":"file","🎲":"shuffle","🔀":"shuffle","⬇":"dl","↺":"refresh","↻":"refresh","🔄":"refresh","➕":"plus","⚙":"gear","👀":"eye","❓":"help","🚶":"walk","🏃":"run","🚴":"bike","🏀":"ball","🌿":"leaf","🌱":"leaf","🥬":"leaf","🥦":"leaf","⚡":"zap","🏊":"waves","💚":"heart","🧮":"hash","🔢":"hash","☁":"cloud","☐":"square","☕":"coffee","🧢":"user"};
const RX=/(?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*|[✓✕★☆✎☐☑↺↻])+/gu;
const one=/\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*|[✓✕★☆✎☐☑↺↻]/u;
function svg(k){const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("class","lic");s.setAttribute("aria-hidden","true");
 const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",P[k]||P.utensils);s.append(p);return s;}
const STRIP=new Set(["OPTION","TITLE","TEXTAREA","SCRIPT","STYLE"]);
function fixText(n){const t=n.nodeValue;RX.lastIndex=0;if(!RX.test(t))return;const par=n.parentNode;if(!par)return;
 if(STRIP.has(par.nodeName)){n.nodeValue=t.replace(RX,"").replace(/^\s+/,"");return;}
 const f=document.createDocumentFragment();let last=0;t.replace(RX,(m,i)=>{f.append(t.slice(last,i));const c=m.match(one)[0].replace(/\uFE0F/g,"");f.append(svg(M[c]||M[[...c][0]]));last=i+m.length;});f.append(t.slice(last));par.replaceChild(f,n);}
function fixAttrs(el){["placeholder","aria-label","title","alt"].forEach(a=>{const v=el.getAttribute&&el.getAttribute(a);if(v){RX.lastIndex=0;if(RX.test(v))el.setAttribute(a,v.replace(RX,"").trim());}});
 if(el.nodeName==="INPUT"&&el.type!=="hidden"&&el.value){RX.lastIndex=0;if(RX.test(el.value))el.value=el.value.replace(RX,"").trim();}}
function walk(root){if(root.nodeType===3){fixText(root);return;}if(root.nodeType!==1||root.nodeName==="svg"||root.nodeName==="SCRIPT"||root.nodeName==="STYLE")return;fixAttrs(root);
 const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);const L=[];let n;while(n=tw.nextNode()){if(n.nodeType===3)L.push(n);else fixAttrs(n);}L.forEach(fixText);}
window.pjIconsWalk=()=>walk(document.body);
walk(document.body);document.title=document.title.replace(RX,"").trim();
new MutationObserver(ms=>ms.forEach(m=>{if(m.type==="characterData")fixText(m.target);else if(m.type==="attributes")fixAttrs(m.target);else m.addedNodes.forEach(walk);})).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["placeholder","aria-label","title","alt"]});
})();
