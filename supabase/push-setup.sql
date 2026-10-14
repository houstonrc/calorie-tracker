-- PlateJack background push: PART 1 (tables + RLS). Safe to re-run.
create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  tz text not null default 'America/New_York',
  prefs jsonb,
  ua text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions add column if not exists prefs jsonb;
alter table public.push_subscriptions enable row level security;
drop policy if exists "own subs select" on public.push_subscriptions;
drop policy if exists "own subs insert" on public.push_subscriptions;
drop policy if exists "own subs update" on public.push_subscriptions;
drop policy if exists "own subs delete" on public.push_subscriptions;
create policy "own subs select" on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "own subs insert" on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "own subs update" on public.push_subscriptions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subs delete" on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant usage, select on sequence public.push_subscriptions_id_seq to authenticated;
create index if not exists push_subscriptions_user on public.push_subscriptions(user_id);

-- Dedupe log, written only by the Edge Function (service role). No client policies = no client access.
create table if not exists public.push_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.push_log enable row level security;

-- PART 2 (schedule) is in push-cron.sql. Run it after the send-reminders function is deployed.
