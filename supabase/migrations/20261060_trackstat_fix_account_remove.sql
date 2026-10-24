-- Removing an account on the website failed: trackstat_user_account_remove (migration 20261056) touched trackstat_reset_connections,
-- a table that only exists if migration 20261052 was applied, and it was not. The reset-marker step now runs only when that table exists.
begin;

create or replace function public.trackstat_user_account_remove(p_account uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  delete from public.trackstat_user_accounts where user_id = auth.uid() and account_id = p_account;
  if to_regclass('public.trackstat_reset_connections') is not null then
    execute 'update public.trackstat_reset_connections set user_ids = array_remove(user_ids, $1) where id = $2 and $1 = any(user_ids)' using auth.uid(), p_account;
  end if;
  -- Nobody has it linked any more, so its data is no longer stored (a key submitted again on the website connects it again)
  update public.trackstat_accounts a set website_seen_at = null
  where a.id = p_account and not exists (select 1 from public.trackstat_user_accounts u where u.account_id = a.id);
end $$;

notify pgrst, 'reload schema';
commit;
