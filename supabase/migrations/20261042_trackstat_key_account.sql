-- Lets the separate Trackstat server (trackstat-server/) check a connection key. Not applied until that server is live.
begin;

create or replace function public.trackstat_key_account(p_key text)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key,'sha256'),'hex');
$$;
revoke all on function public.trackstat_key_account(text) from public;
grant execute on function public.trackstat_key_account(text) to anon, authenticated;

commit;
