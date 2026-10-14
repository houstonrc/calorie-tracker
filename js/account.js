/* Delete account + health note */
(function(){
const NOTE="Calorie and burn numbers are estimates. PlateJack is not medical advice; talk to a doctor before big diet or exercise changes.";
const SH='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 8v5M12 16h.01"/></svg>';
const TR='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
document.head.insertAdjacentHTML("beforeend",`<style>
.hnote{display:flex;gap:10px;align-items:flex-start;font-size:.8rem;line-height:1.4;color:var(--muted,#a0a0a0);text-align:left}.hnote svg{flex:0 0 18px;color:var(--acc-hi,#ff9a45);margin-top:1px}
.hnote.box{border:1px solid var(--line);border-radius:14px;padding:12px;background:rgba(255,255,255,.03)}
.bestv .hnote{margin-top:10px;font-size:.72rem;justify-content:center}
#delCard{border:1px solid rgba(229,72,77,.45)!important;background:rgba(229,72,77,.06)!important}#delCard p{font-size:.85rem;color:var(--muted,#a0a0a0);margin:6px 0 12px}
button.danger,#delCard button.danger,#delDlg button.danger{background:#e5484d!important;border-color:#e5484d!important;color:#fff!important;box-shadow:none!important;width:100%;display:inline-flex;gap:8px;justify-content:center;align-items:center}
button.danger:disabled{opacity:.35}
#delDlg ul{margin:8px 0 14px;padding-left:18px;font-size:.88rem;line-height:1.55}#delDlg .warn{color:#ff8a8d;font-weight:700;font-size:.85rem}
#delIn{text-transform:uppercase;letter-spacing:.15em;font-weight:700;text-align:center}
</style>`);
const note=c=>`<div class="hnote ${c||""}">${SH}<span>${NOTE}</span></div>`;
const q=s=>document.querySelector(s);
// burn sheet
q("#bWho")?.parentElement.insertAdjacentHTML("beforeend",note());
// onboarding setup
const of=q(".oset .fine:last-child");if(of)of.outerHTML=`<div style="margin-top:12px">${note("box")}</div>`;
// help center
q("#hcLegal")?.insertAdjacentHTML("afterbegin",`<div style="margin:0 0 12px">${note("box")}</div>`);
// settings root: About card
const sl=q("#sList");if(sl)sl.parentElement.querySelector("p.fine:last-child").insertAdjacentHTML("beforebegin",`<div class="grp">About</div><div class="card" id="aboutCard"><b style="display:block;margin-bottom:8px">PlateJack ${typeof C_VER!=="undefined"?C_VER:""}</b>${note()}<a class="srow" id="aboutSupport" href="mailto:platejacksupport@gmail.com?subject=PlateJack%20support" style="margin-top:10px;display:flex;gap:10px;align-items:center;text-decoration:none;color:inherit"><span class="sic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span><span class="rl" style="flex:1"><b>Contact support</b><small style="display:block;text-decoration:none">platejacksupport@gmail.com</small></span><span class="sch">›</span></a></div>`);
// delete card
q("#proCard")?.insertAdjacentHTML("afterend",`<div class="grp">Danger zone</div><div class="card" id="delCard"><b id="delT"></b><p id="delP"></p><button type="button" class="danger" id="delOpen">${TR}<span id="delB"></span></button></div>`);
document.body.insertAdjacentHTML("beforeend",`<dialog id="delDlg" class="tall"><div class="shd"><h2 id="dlT"></h2><button type="button" class="ghost small" id="dlX">Cancel</button></div>
<p id="dlIntro"></p><ul id="dlList"></ul><p class="warn">This can't be undone. Want a copy first? Use Export backup above.</p>
<label for="delIn">Type DELETE to confirm</label><input id="delIn" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DELETE">
<button type="button" class="danger" id="delGo" disabled style="margin-top:14px">${TR}<span id="dlGoT"></span></button><p class="fine" id="dlErr" style="color:#ff8a8d"></p></dialog>`);
const signed=()=>typeof sbUser!=="undefined"&&!!sbUser;
function paint(){const s=signed();q("#delT").textContent=s?"Delete account":"Delete all my data";
 q("#delP").textContent=s?"Permanently delete your PlateJack account, synced data and everything on this device.":"Erase all food logs, workouts, goals and settings saved on this device.";q("#delB").textContent=s?"Delete account":"Delete all my data";}
q("#delOpen").onclick=()=>{const s=signed();q("#dlT").textContent=s?"Delete account?":"Delete all data?";
 q("#dlIntro").textContent=s?`This permanently deletes the account ${sbUser.email||""} and:`:"This erases everything PlateJack saved on this device:";
 q("#dlList").innerHTML=(s?["Your login and profile","All synced data in the cloud: food log, workouts, lifts, goals, weights","Feedback you sent and push notification sign-ups"]:[]).concat(["Food log, workouts, lifts, weights and goals on this device","Settings, favorites and fridge items"]).map(x=>`<li>${x}</li>`).join("");
 q("#dlGoT").textContent=s?"Delete my account":"Delete all my data";q("#delIn").value="";q("#delGo").disabled=true;q("#dlErr").textContent="";q("#delDlg").showModal();};
q("#dlX").onclick=()=>q("#delDlg").close();
q("#delIn").oninput=e=>{q("#delGo").disabled=e.target.value.trim().toUpperCase()!=="DELETE";};
async function wipeLocal(){try{localStorage.clear();sessionStorage.clear();}catch(e){}try{for(const k of await caches.keys())if(/photo/i.test(k))await caches.delete(k);}catch(e){}}
q("#delGo").onclick=async()=>{const b=q("#delGo");b.disabled=true;q("#dlGoT").textContent="Deleting…";
 try{if(signed()&&sb){const r=await sb.rpc("delete_my_account");window._delRpc={ok:!r.error,status:r.status,error:r.error?(r.error.code||"")+" "+r.error.message:null};try{sessionStorage.setItem("pj_del_rpc",JSON.stringify(window._delRpc));}catch(e){}
   if(r.error){console.warn("delete_my_account failed",r.error);q("#dlErr").textContent="Your account could not be deleted, so nothing was removed and you are still signed in. Please try again later or contact support. ("+(r.error.message||"server error")+")";q("#dlGoT").textContent="Try again";b.disabled=false;return;}
   try{await sb.auth.signOut();}catch(e){}}
  await wipeLocal();location.replace(location.pathname);}
 catch(e){q("#dlErr").textContent="Couldn't delete right now. Check your connection and try again.";b.disabled=false;q("#dlGoT").textContent="Try again";}};
const _ra=typeof renderAccount==="function"?renderAccount:null;if(_ra)window.renderAccount=renderAccount=function(){_ra();paint();};
paint();
})();
