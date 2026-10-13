# Background push setup (Supabase)

The app already does local reminders + the 🔔 inbox. Background push (when PlateJack is closed) needs these one-time steps:

1. **SQL**: run `supabase/notifications.sql` in the Supabase SQL editor (creates `push_subscriptions` with RLS, `push_log`, and the pg_cron job). Enable the `pg_cron` and `pg_net` extensions first if the editor asks.
2. **Vault secret** for the cron call: `select vault.create_secret('<random CRON_SECRET>', 'pj_cron_secret');`
3. **Edge Function**: with the Supabase CLI logged in (`supabase login` needs a personal access token):
   ```
   supabase link --project-ref gxlxdpsnvgdbgfzeyusd
   supabase secrets set VAPID_PUBLIC=<public key in index.html VAPID_PUB> VAPID_PRIVATE=<private key> VAPID_SUBJECT=mailto:<you> CRON_SECRET=<same as step 2>
   supabase functions deploy send-push --no-verify-jwt
   ```
   The VAPID private key was generated for this project and is kept outside the repo (not committed).
4. Signed-in users who turn on notifications are then subscribed automatically (the app upserts into `push_subscriptions`).

iPhone: Web Push only works when PlateJack is installed to the Home Screen (iOS/iPadOS 16.4+).
