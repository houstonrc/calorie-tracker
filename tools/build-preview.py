# Builds /preview/: a separate copy of PlateJack with progressive feature reveal.
# Own localStorage keys (ct_data_preview), own SW scope, cloud sync disabled.
import re,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(R,'index.html')).read()
def rep(a,b,count=1):
  global s
  assert a in s,a[:60]
  s=s.replace(a,b,count)
rep('<head>','<head>\n<base href="../">')
rep('const KEY="ct_data_v1";','const KEY="ct_data_preview";')
rep('BK_KEY="ct_data_v1_backup"','BK_KEY="ct_data_preview_backup"')
rep('SYNC_KEY="pj_sync_v1"','SYNC_KEY="pj_sync_preview"')
rep('storageKey:"pj-auth"','storageKey:"pj-auth-preview"')
rep('try{if(window.supabase&&/^https?:$/','try{if(false&&window.supabase&&/^https?:$/')  # no cloud in preview
rep('serviceWorker.register("./calorie-sw.js",{updateViaCache:"none"})','serviceWorker.register(new URL("preview/preview-sw.js",document.baseURI),{scope:new URL("preview/",document.baseURI).pathname,updateViaCache:"none"})')
rep('<title>','<title>Preview · ')
rep('<b class="pjw">PLATE<span>JACK</span></b></span>','<b class="pjw">PLATE<span>JACK</span></b><small class="rvtag">PREVIEW</small></span>')
rep('<div class="card" id="noGoal"','''<div class="card rvnew" id="rvNew" style="display:none"></div>
  <div class="card rvfirst" id="rvFirst"><div class="rvfe">🍽️</div><b>Start with one meal</b><small>Log what you ate last. That's all for today.</small><button id="rvFirstBtn">＋ Log your first meal</button></div>
  <button class="link rvopt" id="rvOpt" style="display:none">💵 Want budget tracking now?</button>
  <div class="card" id="noGoal"''')
rep('<button class="link" id="snapBtn">','<button class="link rvrec" id="rvRecipes" onclick="openPrep()">🥡 Recipes</button><button class="link" id="snapBtn">')
rep('<div class="grp">Membership</div><div class="card" id="proCard"></div>','<div class="grp rvpro">Membership</div><div class="card rvpro" id="proCard"></div>')
rep('<div class="grp">Jack Coach</div><div class="card">','<div class="grp rvwk">Jack Coach</div><div class="card rvwk">')
rep('<div class="grp">Notifications</div><div class="card" id="ntCard">','<div class="grp rvwk">Notifications</div><div class="card rvwk" id="ntCard">')
rep('<dialog id="bset">','''<dialog id="rvSkip"><h2 style="margin:0 0 6px">Preview: skip ahead</h2><p class="muted" style="margin:0 0 12px">Replaces the preview's sample data (your real PlateJack data is never touched).</p><div class="rvdays"><button data-d="1">Day 1</button><button data-d="3">Day 3</button><button data-d="7">Day 7</button></div><button class="ghost small" id="rvSkipX" style="width:100%;margin-top:10px">Close</button></dialog>
<dialog id="bset">''')
js=open(os.path.join(R,'tools','reveal.js')).read()
i=s.index('const SB_URL=');j=s.index('</script>',i)
s=s[:j]+js+s[j:]
css='''/* preview reveal */
.rvtag{font-size:.55rem;font-weight:800;letter-spacing:.12em;margin-left:6px;padding:2px 6px;border-radius:6px;background:var(--a1);color:#1a0f07}
html.rv:not(.rv-recipes) .mcard,html.rv:not(.rv-recipes) #snapBtn,html.rv:not(.rv-recipes) #quickBtn,html.rv:not(.rv-recipes) #rvRecipes{display:none!important}
html.rv:not(.rv-budget) #budStrip{display:none!important}
html.rv:not(.rv-fridge) #frCard,html.rv:not(.rv-fridge) #gFridge{display:none!important}
html.rv:not(.rv-week) nav button[data-t=history],html.rv:not(.rv-week) nav button[data-t=plan],html.rv:not(.rv-week) #coach,html.rv:not(.rv-week) #rptBan,html.rv:not(.rv-week) #bellBtn,html.rv:not(.rv-week) .rvwk{display:none!important}
html.rv:not(.rv-pro) .rvpro,html.rv:not(.rv-pro) #scanLock{display:none!important}
html[data-bg] body .rvfirst{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:26px 18px!important}html[data-bg] body .rvfirst .rvfe{font-size:2.6rem}html[data-bg] body .rvfirst b{font-size:1.25rem}html[data-bg] body .rvfirst small{opacity:.75;margin-bottom:10px}html[data-bg] body .rvfirst button{width:100%;padding:16px;font-size:1.1rem}
html[data-bg] body .rvnew{display:flex;gap:14px;align-items:flex-start;border:1px solid var(--a1)!important;padding:16px!important}html[data-bg] body .rvi{font-size:1.8rem}html[data-bg] body .rvl{display:flex;flex-direction:column;gap:4px;min-width:0}html[data-bg] body .rvl small{opacity:.8}html[data-bg] body .rvb{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
html[data-bg] body .rvopt{display:block;margin:4px auto 0}
html[data-bg] body .rvdays{display:flex;gap:8px}html[data-bg] body .rvdays button{flex:1}
'''
i=s.rfind('</style>');s=s[:i]+css+s[i:]
os.makedirs(os.path.join(R,'preview'),exist_ok=True)
open(os.path.join(R,'preview','index.html'),'w').write(s)
open(os.path.join(R,'preview','preview-sw.js'),'w').write('''// Preview SW: scope /preview/ only, network-first, own cache. Does not touch the main app cache.
const C="pj-preview-v1";
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./","index.html"])).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith("pj-preview-")&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==self.location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"))));});
''')
print('preview built',len(s))
