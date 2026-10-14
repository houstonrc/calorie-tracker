// PlateJack off-proxy Edge Function (Deno, single file).
// Proxies Open Food Facts product SEARCH only, so the browser app avoids OFF's missing CORS headers.
//   GET /functions/v1/off-proxy?q=<terms>[&n=20]  ->  { products: [{code,product_name,brands,serving_size,serving_quantity,nutriments}], src }
// Tries OFF's search API (search.openfoodfacts.org) first, then the legacy cgi/search.pl.
// Responses are cached in memory per instance (10 min) and via Cache-Control for browsers/CDN.
// Deploy with "Verify JWT" OFF:  supabase functions deploy off-proxy --no-verify-jwt
const ALLOW = new Set(["https://houstonrc.github.io", "http://localhost:8080", "http://127.0.0.1:8080"]);
const UA = "PlateJack/1.0 (platejacksupport@gmail.com)";
const FIELDS = "code,product_name,brands,serving_size,serving_quantity,nutriments";
const TTL = 10 * 60 * 1000, MAX = 500;
const cache = new Map<string, { t: number; body: string }>();

function cors(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOW.has(origin) ? origin : "https://houstonrc.github.io",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
const json = (o: unknown, status: number, h: Record<string, string>, extra: Record<string, string> = {}) =>
  new Response(typeof o === "string" ? o : JSON.stringify(o), { status, headers: { ...h, "Content-Type": "application/json", ...extra } });

async function get(url: string, ms = 6000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ac.signal }); return r; } finally { clearTimeout(t); }
}
const brands = (b: unknown) => Array.isArray(b) ? b.join(", ") : String(b ?? "");

async function search(q: string, n: number) {
  // 1) search-a-licious API
  try {
    const r = await get(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=${n}&fields=${FIELDS}&langs=en`);
    if (r.ok) {
      const d = await r.json();
      const products = (d.hits || []).map((p: any) => ({ code: p.code, product_name: p.product_name, brands: brands(p.brands), serving_size: p.serving_size, serving_quantity: p.serving_quantity, nutriments: p.nutriments || {} }));
      if (products.length) return { products, src: "search-a-licious" };
    }
  } catch (_) { /* fall through */ }
  // 2) legacy cgi search (US products)
  const r = await get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=${n}&tagtype_0=countries&tag_contains_0=contains&tag_0=united-states&fields=${FIELDS}`);
  if (!r.ok) throw new Error("upstream " + r.status);
  const d = await r.json();
  return { products: d.products || [], src: "cgi" };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "GET") return json({ error: "method" }, 405, h);
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 80);
  const n = Math.min(24, Math.max(1, +(u.searchParams.get("n") || 20) || 20));
  if (q.length < 2) return json({ error: "q required" }, 400, h);
  const key = q.toLowerCase() + "|" + n;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return json(hit.body, 200, h, { "Cache-Control": "public, max-age=600", "X-Cache": "HIT" });
  try {
    const body = JSON.stringify(await search(q, n));
    if (cache.size >= MAX) cache.delete(cache.keys().next().value!);
    cache.set(key, { t: Date.now(), body });
    return json(body, 200, h, { "Cache-Control": "public, max-age=600", "X-Cache": "MISS" });
  } catch (e) {
    return json({ error: "upstream", detail: String(e) }, 502, h, { "Cache-Control": "no-store" });
  }
});
