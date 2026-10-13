/* Swipe-down-to-close for sheets/dialogs + Settings sub-pages, and Back button closes the top sheet. */
(function(){
const TH=120,FLICK=0.6,RES=0.82;
function atTop(t,root){for(let e=t;e&&e!==root.parentNode;e=e.parentNode){if(e.nodeType===1&&e.scrollTop>0){const cs=getComputedStyle(e);if(/(auto|scroll)/.test(cs.overflowY)||e===root)return false;}}return true;}
function noDrag(t){return t.closest&&t.closest('input[type=range],textarea,select,.hscroll,[data-nodrag]');}
function bind(el,{close,canStart,target}){
 let y0=0,t0=0,dy=0,on=false,live=false,lastY=0,lastT=0,v=0;
 const tgt=()=>target?target():el;
 el.addEventListener('touchstart',e=>{if(e.touches.length!==1||noDrag(e.target)||!canStart(e))return;on=true;live=false;y0=lastY=e.touches[0].clientY;t0=lastT=performance.now();dy=0;v=0;},{passive:true});
 el.addEventListener('touchmove',e=>{if(!on)return;const y=e.touches[0].clientY,d=y-y0,now=performance.now();
  if(!live){if(d<-4){on=false;return;}if(d>6&&atTop(e.target,el)){live=true;tgt().style.transition='none';}else return;}
  e.preventDefault();dy=Math.max(0,d);v=(y-lastY)/Math.max(1,now-lastT);lastY=y;lastT=now;tgt().style.transform=`translateY(${dy*RES}px)`;},{passive:false});
 const end=()=>{if(!on)return;on=false;if(!live)return;const T=tgt();T.style.transition='transform .22s cubic-bezier(.2,.8,.2,1)';
  if(dy>TH||(v>FLICK&&dy>30)){T.style.transform='translateY(100%)';setTimeout(()=>{T.style.transform='';T.style.transition='';close();},200);el.dataset.swiped='1';}
  else{T.style.transform='';setTimeout(()=>{T.style.transition='';},240);}};
 el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);
 el._swipe={close};}
// dialogs
const stack=[],TOK=Math.random().toString(36).slice(2);let fromPop=false,pend=0;
const _sm=HTMLDialogElement.prototype.showModal;
const anyOpen=()=>stack.some(d=>d.open);const ours=()=>history.state&&history.state.k===TOK;
function arm(){if(!ours()&&!pend)history.pushState(Object.assign({},history.state||{},{dlg:1,k:TOK}),'');}
HTMLDialogElement.prototype.showModal=function(){const was=this.open;_sm.apply(this,arguments);if(was)return;const me=this;me.scrollTop=0;requestAnimationFrame(()=>{me.scrollTop=0;});
 {const j=stack.indexOf(this);if(j>=0)stack.splice(j,1);}stack.push(this);arm();};
function wire(d){if(d._sw)return;d._sw=1;if(!d.querySelector(':scope>.grab')){const g=document.createElement('div');g.className='grab';g.setAttribute('aria-hidden','true');d.prepend(g);}
 d.addEventListener('close',()=>{if(d.open)return;const i=stack.indexOf(d);if(i>=0)stack.splice(i,1);
  if(!fromPop)setTimeout(()=>{if(!anyOpen()&&ours()&&!pend){pend++;history.back();}},0);});
 bind(d,{close:()=>d.close(),canStart:()=>d.open&&!stack.some(x=>x!==d&&x.open&&stack.indexOf(x)>stack.indexOf(d))});}
addEventListener('popstate',e=>{if(pend>0){pend--;e.stopImmediatePropagation();if(anyOpen())arm();return;}
 const top=[...stack].reverse().find(d=>d.open);if(top){e.stopImmediatePropagation();fromPop=true;top.close();fromPop=false;if(anyOpen())arm();}},true);
function wireAll(){document.querySelectorAll('dialog').forEach(wire);}
// settings sub-pages
function wireSub(){const T=document.getElementById('tab-settings');if(!T||T._sw)return;T._sw=1;
 bind(T,{close:()=>{if(history.state&&history.state.sp)history.back();else if(window.setGo)setGo(null);},canStart:()=>T.classList.contains('insub')&&(window.scrollY||document.documentElement.scrollTop)<=0,target:()=>T.querySelector('.sp.on')||T});}
const st=document.createElement('style');st.textContent=`dialog::before{display:none!important}dialog>.grab{display:block;width:44px;height:5px;border-radius:99px;background:rgba(214,190,160,.55);margin:-4px auto 12px;position:relative;touch-action:none}
dialog>.grab::after{content:"";position:absolute;left:-30px;right:-30px;top:-12px;bottom:-12px}
#tab-settings.insub .sp.on::before{content:"";display:block;width:44px;height:5px;border-radius:99px;background:rgba(214,190,160,.45);margin:0 auto 10px}`;
document.head.appendChild(st);
function init(){wireAll();wireSub();let q=0;new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(()=>{q=0;wireAll();});}}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SWIPE={stack,bind};
})();
