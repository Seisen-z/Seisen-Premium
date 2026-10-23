-- Removing an account on the website now stops its data being stored again (it is no longer "connected"),
-- unless someone else still has it linked to a login. Another visitor still using the same key re-connects it on their next visit.
begin;

create or replace function public.trackstat_site_forget(p_keys text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_keys is null or cardinality(p_keys) = 0 then return; end if;
  if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
  update public.trackstat_accounts a set website_seen_at = null
  where a.key_hash in (select encode(extensions.digest(k, 'sha256'), 'hex') from unnest(p_keys) k)
    and not exists (select 1 from public.trackstat_user_accounts u where u.account_id = a.id);
end $$;
revoke all on function public.trackstat_site_forget(text[]) from public, anon, authenticated;
grant execute on function public.trackstat_site_forget(text[]) to anon, authenticated;

create or replace function public.trackstat_user_account_remove(p_account uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  delete from public.trackstat_user_accounts where user_id = auth.uid() and account_id = p_account;
  update public.trackstat_reset_connections set user_ids = array_remove(user_ids, auth.uid())
  where id = p_account and auth.uid() = any(user_ids);
  update public.trackstat_accounts a set website_seen_at = null
  where a.id = p_account and not exists (select 1 from public.trackstat_user_accounts u where u.account_id = a.id);
end $$;

notify pgrst, 'reload schema';
commit;
