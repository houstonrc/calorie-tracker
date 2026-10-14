// PlateJack send-reminders Edge Function (Deno, single file).
// Called every 15 min by pg_cron (see supabase/push-setup.sql) with header x-cron-secret.
// Function secrets: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, CRON_SECRET.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.
// Deploy with "Verify JWT" OFF (auth is the x-cron-secret header).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:platejacksupport@gmail.com",
  Deno.env.get("VAPID_PUBLIC")!,
  Deno.env.get("VAPID_PRIVATE")!,
);

const WINDOW_MIN = 15; // must match the cron interval
const hm = (s: unknown) => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
function local(tz: string, d = new Date()) {
  let zone = tz; try { new Intl.DateTimeFormat("en-US", { timeZone: zone }); } catch { zone = "America/New_York"; }
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" }).formatToParts(d).map((x) => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute, dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday) };
}
const addDays = (ymd: string, n: number) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysLeft = (use: string | null, today: string) => use ? Math.round((Date.parse(use) - Date.parse(today)) / 864e5) : null;

type Msg = { key: string; title: string; body: string; act: string };
function due(data: any, prefs: any, tz: string): Msg[] {
  const N = prefs?.notif || data?.notif; if (!N?.on) return [];
  const T = N.types || {}; const L = local(tz); const out: Msg[] = [];
  const hit = (min: number) => min <= L.min && L.min - min < WINDOW_MIN;
  const days = data?.days || {}; const today = days[L.ymd] || {};
  const entries: any[] = Array.isArray(today.entries) ? today.entries : [];
  // Meal log
  if (T.meal?.on) ["Breakfast", "Lunch", "Dinner"].forEach((m, i) => {
    const t = T.meal.times?.[i];
    if (t && hit(hm(t)) && !entries.some((e) => e.meal === m))
      out.push({ key: `meal:${L.ymd}:${m}`, title: `Log your ${m.toLowerCase()}?`, body: `Nothing logged for ${m.toLowerCase()} yet. It takes 10 seconds.`, act: "add" });
  });
  // Water
  if (T.water?.on) {
    const ev = Math.max(1, +T.water.every || 2) * 60;
    for (let mm = hm(T.water.start) + ev; mm <= hm(T.water.end); mm += ev)
      if (hit(mm)) out.push({ key: `water:${L.ymd}:${mm}`, title: "Water break", body: "Time for a glass of water.", act: "today" });
  }
  // Workout: evening nudge if nothing logged today and weekly goal not yet met
  if (T.workout?.on && hit(hm(T.workout.time || "18:00"))) {
    const wkToday = Array.isArray(today.workouts) ? today.workouts.length : 0;
    const goal = +(prefs?.wkGoal?.n ?? data?.wkGoal?.n ?? 4) || 4;
    const mon = addDays(L.ymd, -((L.dow + 6) % 7));
    let n = 0; for (let i = 0; i < 7; i++) { const w = days[addDays(mon, i)]?.workouts; if (Array.isArray(w)) n += w.length; }
    if (!wkToday && n < goal) out.push({ key: `workout:${L.ymd}`, title: "Get a workout in", body: `${n} of ${goal} workouts this week. Even 20 minutes counts.`, act: "today" });
  }
  // Fridge Rescue
  if (T.fridge?.on && hit(hm(T.fridge.time))) {
    const items = (data?.fridge || []).filter((i: any) => { const d = daysLeft(i.use, L.ymd); return (d != null && d <= 1) || i.serv > 0; });
    if (items.length) out.push({ key: `fridge:${L.ymd}`, title: "Fridge Rescue tonight", body: `Use ${items.slice(0, 3).map((i: any) => String(i.name).toLowerCase()).join(", ")}${items.length > 3 ? " and more" : ""} before it goes to waste.`, act: "fridge" });
  }
  if (L.dow === 0 && T.prep?.on && hit(hm(T.prep.time))) out.push({ key: `prep:${L.ymd}`, title: "Sunday prep time", body: "Pick 2-3 cheap meal-prep recipes and build your grocery list.", act: "prep" });
  if (L.dow === 0 && T.report?.on && hit(hm(T.report.time))) out.push({ key: `report:${L.ymd}`, title: "Your Plate Report is ready", body: "See how your week went.", act: "report" });
  // Budget: spend is estimated in the app (price tables) and sent in prefs.budget
  const B = prefs?.budget;
  if (T.budget?.on && B && +B.amt > 0 && +B.spent >= +B.amt * 0.8 && L.min >= 9 * 60 && L.min < 21 * 60) {
    const wk = addDays(L.ymd, -((L.dow + 6) % 7));
    out.push({ key: `budget:${wk}`, title: "Budget heads-up", body: `About $${Math.round(+B.spent)} of your $${Math.round(+B.amt)} weekly food budget is used (est.).`, act: "budget" });
  }
  return out;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });
  const { data: subs, error } = await sb.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth,tz,prefs");
  if (error) return new Response(error.message, { status: 500 });
  const users = [...new Set((subs || []).map((s) => s.user_id))];
  const { data: rows } = users.length ? await sb.from("user_data").select("user_id,data").in("user_id", users) : { data: [] as any[] };
  const byUser = new Map((rows || []).map((r: any) => [r.user_id, r.data]));
  let sent = 0, removed = 0, failed = 0;
  for (const s of subs || []) {
    const msgs = due(byUser.get(s.user_id), s.prefs, s.prefs?.tz || s.tz || "America/New_York");
    for (const m of msgs) {
      const { error: dup } = await sb.from("push_log").insert({ user_id: s.user_id, key: `${m.key}|${s.id}` });
      if (dup) continue; // already sent to this device
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: m.title, body: m.body, tag: m.key, act: m.act }), { TTL: 3600 });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) { await sb.from("push_subscriptions").delete().eq("id", s.id); removed++; break; }
        failed++; await sb.from("push_log").delete().eq("user_id", s.user_id).eq("key", `${m.key}|${s.id}`); // allow retry next run
      }
    }
  }
  return Response.json({ subs: subs?.length || 0, sent, removed, failed });
});
