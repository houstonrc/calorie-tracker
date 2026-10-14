-- PlateJack background push: PART 2 (schedule). Run after deploying send-reminders.
-- Replace PASTE_CRON_SECRET_HERE with the same value you set as the CRON_SECRET function secret.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store the secret in Vault (re-running: delete the old one first).
delete from vault.secrets where name = 'pj_cron_secret';
select vault.create_secret('PASTE_CRON_SECRET_HERE', 'pj_cron_secret');

-- Remove older jobs if they exist, then schedule every 15 minutes.
select cron.unschedule(jobname) from cron.job where jobname in ('platejack-push', 'platejack-reminders', 'platejack-push-log-cleanup');
select cron.schedule('platejack-reminders', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://gxlxdpsnvgdbgfzeyusd.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pj_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000);
$$);
select cron.schedule('platejack-push-log-cleanup', '17 3 * * *', $$ delete from public.push_log where sent_at < now() - interval '15 days' $$);

-- Check: select * from cron.job;  and after 15 min:  select * from net._http_response order by created desc limit 5;
