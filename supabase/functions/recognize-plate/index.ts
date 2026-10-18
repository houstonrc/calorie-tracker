// PlateJack "recognize-plate" Supabase Edge Function: meal photo -> Gemini (food + portions) -> USDA nutrition.
// Files to deploy together: index.ts, handler.ts, core.ts (test/ is local-only, never deploy it).
// 1. Run supabase/plate-scans.sql first (tables plate_scans + pro_members, RPCs take_plate_scan / refund_plate_scan).
// 2. Secrets: GEMINI_API_KEY (required), USDA_API_KEY (recommended; DEMO_KEY is rate-limited).
//    Optional: GEMINI_MODEL (default gemini-3.8-flash), GEMINI_FALLBACK_MODEL (default gemini-3.5-flash-lite, "none" to disable).
//    SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
// 3. Deploy with "Verify JWT" (Enforce JWT verification) ON:  supabase functions deploy recognize-plate
//    Sign-in is checked twice: the Supabase gateway rejects requests without a valid JWT, and handle() calls auth.getUser().
import { createClient } from "npm:@supabase/supabase-js@2";
import { handle } from "./handler.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!, ANON = Deno.env.get("SUPABASE_ANON_KEY")!, SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

Deno.serve((req) => handle(req, {
  getUser: async (auth) => {
    const c = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data, error } = await c.auth.getUser(); return error || !data.user ? null : { id: data.user.id };
  },
  takeScan: async (uid) => {
    const { data, error } = await admin.rpc("take_plate_scan", { p_user: uid, p_limit: 3 });
    if (error) throw new Error("scan counter: " + error.message);
    const row = Array.isArray(data) ? data[0] : data; return { allowed: !!row.allowed, used: row.used, pro: !!row.is_pro };
  },
  refundScan: async (uid) => { await admin.rpc("refund_plate_scan", { p_user: uid }); },
  geminiKey: Deno.env.get("GEMINI_API_KEY") ?? "",
  usdaKey: Deno.env.get("USDA_API_KEY") ?? "DEMO_KEY",
}));
