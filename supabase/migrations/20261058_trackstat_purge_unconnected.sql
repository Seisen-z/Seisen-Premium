-- While only_connected is on, data of accounts that are not connected on the website is removed, so storage stops growing with every library user.
-- Kept on purpose: the account row (so the library can register and show as live) and the anonymous community rows (so the Community counts stay).
begin;

create or replace function public.trackstat_purge_unconnected()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  -- Safety: nothing happens unless enforcement is on and some accounts really are connected
  if not public.trackstat_enforcing() or not exists (select 1 from public.trackstat_connected_accounts()) then
    return jsonb_build_object('purged', false);
  end if;
  with c as (select id from public.trackstat_connected_accounts()),
  s as (delete from public.trackstat_sessions where account_id not in (select id from c) returning 1),
  g as (delete from public.trackstat_daily_gains where account_id not in (select id from c) returning 1),
  m as (delete from public.trackstat_samples where account_id not in (select id from c) returning 1),
  a as (delete from public.trackstat_daily_activity where account_id not in (select id from c) returning 1),
  p as (delete from public.trackstat_pruned_sessions where account_id not in (select id from c) returning 1)
  select jsonb_build_object('purged', true, 'sessions', (select count(*) from s), 'daily_gains', (select count(*) from g),
    'samples', (select count(*) from m), 'daily_activity', (select count(*) from a), 'pruned_ids', (select count(*) from p)) into r;
  return r;
end $$;
revoke all on function public.trackstat_purge_unconnected() from public, anon, authenticated;

-- For the Trackstat server: which of these accounts are not connected (empty unless enforcement is on)
create or replace function public.trackstat_unconnected_accounts(p_ids uuid[])
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(a.id), '{}') from public.trackstat_accounts a
  where cardinality(p_ids) <= 500 and a.id = any(p_ids)
    and public.trackstat_enforcing() and exists (select 1 from public.trackstat_connected_accounts())
    and a.id not in (select id from public.trackstat_connected_accounts());
$$;
revoke all on function public.trackstat_unconnected_accounts(uuid[]) from public;
grant execute on function public.trackstat_unconnected_accounts(uuid[]) to anon, authenticated;

select cron.schedule('trackstat-purge-unconnected', '45 * * * *', $job$select public.trackstat_purge_unconnected()$job$);

notify pgrst, 'reload schema';
commit;
