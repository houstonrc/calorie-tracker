// PlateJack send-push Edge Function (Deno). Deploy: supabase functions deploy send-push --no-verify-jwt
// Secrets: supabase secrets set VAPID_PUBLIC=... VAPID_PRIVATE=... VAPID_SUBJECT=mailto:you@example.com CRON_SECRET=...
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:houstonrc@users.noreply.github.com",
  Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

const WINDOW_MIN = 15;
const hm = (s: string) => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
// local wall-clock parts in a time zone
function local(tz: string, d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" }).formatToParts(d).map(x => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute, dow: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(p.weekday) };
}
const daysLeft = (use: string | null, today: string) => use ? Math.round((Date.parse(use) - Date.parse(today)) / 864e5) : null;

type Msg = { key: string; title: string; body: string; act: string };
function due(data: any, tz: string): Msg[] {
  const N = data?.notif; if (!N?.on) return [];
  const T = N.types || {}; const L = local(tz); const out: Msg[] = [];
  const hit = (min: number) => min <= L.min && L.min - min < WINDOW_MIN;
  const day = data.days?.[L.ymd] || { entries: [] };
  if (T.meal?.on) ["Breakfast", "Lunch", "Dinner"].forEach((m, i) => {
    const t = T.meal.times?.[i]; if (t && hit(hm(t)) && !day.entries.some((e: any) => e.meal === m))
      out.push({ key: `meal:${L.ymd}:${m}`, title: `Log your ${m.toLowerCase()}?`, body: `Nothing logged for ${m.toLowerCase()} yet. It takes 10 seconds.`, act: "add" });
  });
  if (T.water?.on) { const ev = Math.max(1, +T.water.every || 2) * 60; for (let mm = hm(T.water.start) + ev; mm <= hm(T.water.end); mm += ev) if (hit(mm)) out.push({ key: `water:${L.ymd}:${mm}`, title: "Water break 💧", body: "Time for a glass of water.", act: "today" }); }
  if (T.fridge?.on && hit(hm(T.fridge.time))) {
    const items = (data.fridge || []).filter((i: any) => { const d = daysLeft(i.use, L.ymd); return (d != null && d <= 1) || i.serv > 0; });
    if (items.length) out.push({ key: `fridge:${L.ymd}:e`, title: "Fridge Rescue tonight 🧊", body: `Use ${items.slice(0, 3).map((i: any) => String(i.name).toLowerCase()).join(", ")}${items.length > 3 ? " and more" : ""} before it goes to waste.`, act: "fridge" });
  }
  if (L.dow === 0 && T.prep?.on && hit(hm(T.prep.time))) out.push({ key: `prep:${L.ymd}:s`, title: "Sunday prep time 🥡", body: "Pick 2–3 cheap meal-prep recipes and build your grocery list.", act: "prep" });
  if (L.dow === 0 && T.report?.on && hit(hm(T.report.time))) out.push({ key: `report:${L.ymd}:s`, title: "Your Plate Report is ready 📊", body: "See and share how your week went.", act: "report" });
  // Budget alert is computed in-app (needs price tables); the app shows it locally when spend reaches 80%.
  return out;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("forbidden", { status: 403 });
  const { data: subs, error } = await sb.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth,tz");
  if (error) return new Response(error.message, { status: 500 });
  const users = [...new Set((subs || []).map(s => s.user_id))];
  const { data: rows } = users.length ? await sb.from("user_data").select("user_id,data").in("user_id", users) : { data: [] };
  const byUser = new Map((rows || []).map((r: any) => [r.user_id, r.data]));
  let sent = 0, removed = 0;
  for (const s of subs || []) {
    const msgs = due(byUser.get(s.user_id), s.tz || "America/New_York");
    for (const m of msgs) {
      const { error: dup } = await sb.from("push_log").insert({ user_id: s.user_id, key: m.key + "|" + s.id });
      if (dup) continue; // already sent to this device
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: m.title, body: m.body, tag: m.key, act: m.act }), { TTL: 3600 }); sent++; }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) { await sb.from("push_subscriptions").delete().eq("id", s.id); removed++; break; } }
    }
  }
  return Response.json({ subs: subs?.length || 0, sent, removed });
});
