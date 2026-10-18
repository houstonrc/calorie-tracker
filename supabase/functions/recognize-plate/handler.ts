// recognize-plate request handler. Dependencies are injected so it can be tested without Supabase or Gemini.
import { cors, detect, toItems, MODEL, type Detected } from "./core.ts";
export const FREE_PER_DAY = 3;
export type Deps = {
  getUser: (authHeader: string) => Promise<{ id: string } | null>;                 // verifies the Supabase JWT
  takeScan: (userId: string) => Promise<{ allowed: boolean; used: number; pro: boolean }>; // atomic daily counter (SQL take_plate_scan)
  refundScan: (userId: string) => Promise<void>;
  geminiKey: string; usdaKey: string;
  detectFn?: (b64: string, mime: string) => Promise<Detected[]>;                     // test stub
  fetchFn?: typeof fetch;
};

export async function handle(req: Request, d: Deps): Promise<Response> {
  const h = cors(req.headers.get("Origin"));
  const out = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return out({ error: "method" }, 405);
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/.test(auth)) return out({ error: "auth", message: "Sign in to use Snap a plate." }, 401);
  const user = await d.getUser(auth).catch(() => null);
  if (!user) return out({ error: "auth", message: "Sign in to use Snap a plate." }, 401);
  let body: any; try { body = await req.json(); } catch { return out({ error: "bad_request" }, 400); }
  const img = String(body?.image || "").replace(/^data:[^,]+,/, ""), mime = /^image\/(jpeg|png|webp)$/.test(body?.mime) ? body.mime : "image/jpeg";
  if (img.length < 1000 || img.length > 2_800_000 || !/^[A-Za-z0-9+/=\s]+$/.test(img.slice(0, 5000))) return out({ error: "bad_image", message: "That photo couldn't be read." }, 400);
  if (!d.geminiKey) return out({ error: "not_configured" }, 503);
  let s: { allowed: boolean; used: number; pro: boolean };
  try { s = await d.takeScan(user.id); } catch (e) {               // e.g. plate-scans.sql not run yet
    console.error("recognize-plate counter failed:", (e as Error).message); return out({ error: "not_configured" }, 503); }
  if (!s.allowed) return out({ error: "limit", used: s.used, limit: FREE_PER_DAY, message: `You've used your ${FREE_PER_DAY} free scans today. Pro scans are unlimited.` }, 429);
  try {
    const found = d.detectFn ? await d.detectFn(img, mime) : await detect(img, mime, d.geminiKey, d.fetchFn);
    const items = await toItems(found, d.usdaKey, d.fetchFn);
    return out({ items, used: s.used, limit: s.pro ? null : FREE_PER_DAY, pro: s.pro, model: MODEL });
  } catch (e) {
    await d.refundScan(user.id).catch(() => {});
    console.error("recognize-plate failed:", (e as Error).message); // never logs keys or images
    return out({ error: "vision_failed", message: "Couldn't read that photo. Try again or pick foods yourself." }, 502);
  }
}
