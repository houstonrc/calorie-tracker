-- PlateJack: let a signed-in user permanently delete their own account and data.
-- Run once in the Supabase SQL editor. Not yet applied.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from public.user_data          where user_id = uid;
  delete from public.profiles           where id      = uid;
  delete from public.feedback           where user_id = uid;
  delete from public.push_subscriptions where user_id = uid;
  delete from auth.users                where id      = uid;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
