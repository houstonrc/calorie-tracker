-- PlateJack cloud sync schema. Run once in Supabase SQL editor (or psql).
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
drop policy if exists "own row select" on public.user_data;
drop policy if exists "own row insert" on public.user_data;
drop policy if exists "own row update" on public.user_data;
drop policy if exists "own row delete" on public.user_data;
create policy "own row select" on public.user_data for select to authenticated using (auth.uid() = user_id);
create policy "own row insert" on public.user_data for insert to authenticated with check (auth.uid() = user_id);
create policy "own row update" on public.user_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own row delete" on public.user_data for delete to authenticated using (auth.uid() = user_id);
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;
