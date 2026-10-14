-- Fixed delete_my_account(): skips tables that don't exist (push_subscriptions is not created in this project).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.user_data where user_id = uid;
  delete from public.profiles  where id      = uid;
  if to_regclass('public.feedback') is not null then
    execute 'delete from public.feedback where user_id = $1' using uid; end if;
  if to_regclass('public.push_subscriptions') is not null then
    execute 'delete from public.push_subscriptions where user_id = $1' using uid; end if;
  delete from auth.users where id = uid;
end; $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
