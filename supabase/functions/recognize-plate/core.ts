// recognize-plate core: Gemini 2.5 Flash food detection + USDA nutrition lookup. No secrets are logged.
export type Item = { name: string; unit: string; qty: number; step: number; per: { cal: number; p: number; c: number; f: number };
  conf: number; at: [number, number] | null; note?: string; src: "usda" | "model"; fdc?: number };

const ALLOW = [/^https:\/\/houstonrc\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/, /^https:\/\/localhost$/ /* Android app (Capacitor) */];
export function cors(origin: string | null): Record<string, string> {
  const ok = !!origin && ALLOW.some((r) => r.test(origin));
  return { "Access-Control-Allow-Origin": ok ? origin! : "https://houstonrc.github.io", "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
}

// Gemini 2.5 Flash is closed to new API users (Google returns 404 "no longer available to new users"), so the default is the
// model Google points to instead. Override with the GEMINI_MODEL secret without a code change.
const envModel = (() => { try { return Deno.env.get("GEMINI_MODEL"); } catch (_) { return undefined; } })();
export const MODEL = envModel || "gemini-3.8-flash";
const UNITS = ["oz", "cup", "tbsp", "tsp", "piece", "slice", "serving"];
const PROMPT = `You are the food recognizer in a calorie-tracking app. Look at the photo and list every distinct food or drink
that will be eaten (include visible sauces, dressings, oils and cheese; skip plates, cutlery and garnish under 5 g).
For each item give:
- name: short, plain US name, e.g. "Grilled chicken thigh", "Steamed broccoli", "White rice"
- usda_query: 2-4 generic words to look the food up in USDA FoodData Central, e.g. "chicken thigh grilled"
- unit: one of oz, cup, tbsp, tsp, piece, slice, serving  (meat/fish in oz, grains/veg in cup, sauces in tbsp)
- qty: your best estimate of the portion in that unit
- grams: the same portion in grams
- kcal, protein_g: your own estimate for that portion (used only if the database has no match)
- confidence: 0-1 that the item is really there and correctly named
- x, y: centre of the item as a percent (0-100) of image width and height
- note: empty, or one short sentence if the user should double-check (e.g. "Might be under the chicken.")
If the photo shows no food, return {"items": []}.`;

const SCHEMA = { type: "OBJECT", properties: { items: { type: "ARRAY", items: { type: "OBJECT", properties: {
  name: { type: "STRING" }, usda_query: { type: "STRING" }, unit: { type: "STRING", enum: UNITS }, qty: { type: "NUMBER" }, grams: { type: "NUMBER" },
  kcal: { type: "NUMBER" }, protein_g: { type: "NUMBER" }, confidence: { type: "NUMBER" }, x: { type: "NUMBER" }, y: { type: "NUMBER" }, note: { type: "STRING" } },
  required: ["name", "usda_query", "unit", "qty", "grams", "kcal", "protein_g", "confidence", "x", "y"] } } }, required: ["items"] };

// Fast, cheap answers: no long reasoning. Gemini 3.x uses thinkingLevel; 2.x used thinkingBudget.
const envFb = (() => { try { return Deno.env.get("GEMINI_FALLBACK_MODEL"); } catch (_) { return undefined; } })();
// Used only when the main model is overloaded (429/500/503) twice in a row. Set GEMINI_FALLBACK_MODEL="none" to disable.
export const FALLBACK_MODEL = envFb === "none" ? "" : (envFb || "gemini-3.5-flash-lite");
const think = (m: string) => /gemini-2\./.test(m) ? { thinkingBudget: 0 } : { thinkingLevel: "low" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export type Detected = { name: string; usda_query: string; unit: string; qty: number; grams: number; kcal: number; protein_g: number; confidence: number; x: number; y: number; note?: string };
type F = typeof fetch;

export async function detect(imageB64: string, mime: string, key: string, f: F = fetch, waitMs = 1200): Promise<Detected[]> {
  const call = (model: string) => f(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: imageB64 } }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: SCHEMA, thinkingConfig: think(model) } }) });
  const busy = (s: number) => s === 429 || s === 500 || s === 503;
  let r = await call(MODEL);
  if (busy(r.status)) { await sleep(waitMs); r = await call(MODEL); }          // one retry on overload
  if (busy(r.status) && FALLBACK_MODEL && FALLBACK_MODEL !== MODEL) r = await call(FALLBACK_MODEL);
  if (!r.ok) { let m = ""; try { m = (await r.json())?.error?.message ?? ""; } catch (_) { /* */ } throw new Error(`gemini ${r.status} ${String(m).slice(0, 160)}`); }
  const j = await r.json();
  const txt = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  const items = JSON.parse(txt || "{}").items;
  return Array.isArray(items) ? items.slice(0, 12) : [];
}

// ---- USDA FoodData Central (per 100 g) ----
const usdaCache = new Map<string, { fdc: number; cal: number; p: number; c: number; f: number } | null>();
const N = (food: any, ids: number[]) => { for (const id of ids) { const n = food.foodNutrients?.find((x: any) => x.nutrientId === id); if (n && typeof n.value === "number") return n.value; } return null; };
export async function usda(query: string, key: string, f: F = fetch) {
  const q = query.trim().toLowerCase(); if (usdaCache.has(q)) return usdaCache.get(q)!;
  let hit = null;
  try {
    // POST: USDA's GET search intermittently answers 400 for some queries.
    const r = await f(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}`, { method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: q, pageSize: 5, dataType: ["Survey (FNDDS)", "SR Legacy", "Foundation"] }) });
    if (r.ok) {
      const foods = (await r.json()).foods || [];
      for (const food of foods) {
        const cal = N(food, [1008, 2047, 2048]); if (cal == null) continue;
        hit = { fdc: food.fdcId, cal, p: N(food, [1003]) ?? 0, c: N(food, [1005]) ?? 0, f: N(food, [1004]) ?? 0 }; break;
      }
    }
  } catch (_) { /* network: fall back to model numbers */ }
  usdaCache.set(q, hit); if (usdaCache.size > 2000) usdaCache.delete(usdaCache.keys().next().value!);
  return hit;
}

const r1 = (n: number) => Math.round(n * 10) / 10, clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
export async function toItems(found: Detected[], usdaKey: string, f: F = fetch): Promise<Item[]> {
  return await Promise.all(found.map(async (d) => {
    const unit = UNITS.includes(d.unit) ? d.unit : "serving";
    const qty = clamp(+d.qty || 1, 0.1, 50), grams = clamp(+d.grams || 0, 0, 3000);
    const step = unit === "oz" ? 1 : unit === "tbsp" || unit === "tsp" || unit === "piece" || unit === "slice" ? 1 : 0.25;
    const u = grams ? await usda(d.usda_query || d.name, usdaKey, f) : null;
    const per = u && grams
      ? { cal: r1(u.cal * grams / 100 / qty), p: r1(u.p * grams / 100 / qty), c: r1(u.c * grams / 100 / qty), f: r1(u.f * grams / 100 / qty) }
      : { cal: r1((+d.kcal || 0) / qty), p: r1((+d.protein_g || 0) / qty), c: 0, f: 0 };
    const conf = clamp(+d.confidence || 0.5, 0, 1);
    return { name: String(d.name).slice(0, 60), unit, qty: r1(qty), step, per, conf, at: [clamp(+d.x, 2, 98), clamp(+d.y, 2, 98)],
      note: d.note ? String(d.note).slice(0, 120) : (conf < 0.6 ? "Not sure about this one. Check it." : undefined), src: u ? "usda" : "model", fdc: u?.fdc } as Item;
  }));
}
