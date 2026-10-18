-- PlateJack: Snap a plate daily scan limit (3 free per day, unlimited for Pro). Run once in the Supabase SQL editor.
-- Users can READ their own counts; only the recognize-plate Edge Function (service role) can change them.
create table if not exists public.plate_scans (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.plate_scans enable row level security;
drop policy if exists "own scans read" on public.plate_scans;
create policy "own scans read" on public.plate_scans for select to authenticated using (auth.uid() = user_id);
revoke all on public.plate_scans from anon, authenticated;
grant select on public.plate_scans to authenticated;

-- Server-trusted Pro status (filled later by the payment webhook; the app's local "Pro" flag is not trusted here).
create table if not exists public.pro_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_until timestamptz not null,
  source text,
  updated_at timestamptz not null default now()
);
alter table public.pro_members enable row level security;
drop policy if exists "own pro read" on public.pro_members;
create policy "own pro read" on public.pro_members for select to authenticated using (auth.uid() = user_id);
revoke all on public.pro_members from anon, authenticated;
grant select on public.pro_members to authenticated;

-- Atomically use one scan. Day boundary = midnight New York time.
create or replace function public.take_plate_scan(p_user uuid, p_limit integer default 3)
returns table (allowed boolean, used integer, is_pro boolean)
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'America/New_York')::date; pro boolean; n integer;
begin
  select exists(select 1 from pro_members where user_id = p_user and active_until > now()) into pro;
  insert into plate_scans as s (user_id, day, count) values (p_user, d, 1)
  on conflict (user_id, day) do update set count = s.count + 1, updated_at = now()
    where pro or s.count < p_limit
  returning s.count into n;
  if n is null then
    select s2.count into n from plate_scans s2 where s2.user_id = p_user and s2.day = d;
    return query select false, n, pro;
  else
    return query select true, n, pro;
  end if;
end $$;

-- Give the scan back when the vision call fails.
create or replace function public.refund_plate_scan(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update plate_scans set count = greatest(count - 1, 0), updated_at = now()
  where user_id = p_user and day = (now() at time zone 'America/New_York')::date;
$$;

revoke all on function public.take_plate_scan(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_plate_scan(uuid) from public, anon, authenticated;
grant execute on function public.take_plate_scan(uuid, integer) to service_role;
grant execute on function public.refund_plate_scan(uuid) to service_role;

-- Clean up old counters (optional, if pg_cron is on):
-- select cron.schedule('platejack-plate-scans-cleanup', '15 4 * * *', $$delete from public.plate_scans where day < current_date - 30$$);
