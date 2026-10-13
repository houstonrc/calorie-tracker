-- PlateJack feedback table. Run once in Supabase → SQL editor.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  email text null check (email is null or length(email) <= 320),
  message text not null check (length(message) between 1 and 4000),
  app_version text null check (app_version is null or length(app_version) <= 40),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
-- insert only; no select/update/delete policies → nobody but service role can read.
revoke all on public.feedback from anon, authenticated;
grant insert (user_id, email, message, app_version) on public.feedback to anon, authenticated;
drop policy if exists "anon insert feedback" on public.feedback;
create policy "anon insert feedback" on public.feedback for insert to anon
  with check (user_id is null);
drop policy if exists "auth insert feedback" on public.feedback;
create policy "auth insert feedback" on public.feedback for insert to authenticated
  with check (user_id is null or user_id = auth.uid());
-- Read it in the dashboard (Table editor) or: select * from public.feedback order by created_at desc;
