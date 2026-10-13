-- PlateJack Web Push: run in Supabase SQL editor (after schema.sql).
create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  tz text not null default 'America/New_York',
  ua text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "own subs select" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "own subs insert" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "own subs update" on public.push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subs delete" on public.push_subscriptions for delete using (auth.uid() = user_id);
create index if not exists push_subscriptions_user on public.push_subscriptions(user_id);

-- Dedupe log written only by the Edge Function (service role); no client policies = no client access.
create table if not exists public.push_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.push_log enable row level security;

-- Schedule: every 15 minutes call the Edge Function (needs pg_cron + pg_net extensions enabled).
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- Store the function secret in Vault once:  select vault.create_secret('<CRON_SECRET>', 'pj_cron_secret');
select cron.schedule('platejack-push', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://gxlxdpsnvgdbgfzeyusd.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pj_cron_secret')),
    body := '{}'::jsonb);
$$);
-- Cleanup old dedupe rows daily.
select cron.schedule('platejack-push-log-cleanup', '17 3 * * *', $$ delete from public.push_log where sent_at < now() - interval '15 days' $$);
