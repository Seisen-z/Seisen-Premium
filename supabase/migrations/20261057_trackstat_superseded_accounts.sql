-- Which of these accounts are an old key of a Roblox account that has a newer key: another account for the same Roblox user
-- was active more recently, and this one has been quiet for 24 hours. The Trackstat server drops the inventories of those.
begin;

create or replace function public.trackstat_superseded_accounts(p_ids uuid[])
returns uuid[] language sql stable security definer set search_path = '' as $$
  with seen as (
    select a.id, a.roblox_id,
      greatest(a.created_at,
        coalesce((select max((v->>'seen_at')::timestamptz) from jsonb_each(a.presence_sessions) e(k, v)), a.created_at),
        coalesce((select max(s.updated_at) from public.trackstat_sessions s where s.account_id = a.id), a.created_at)) last_seen
    from public.trackstat_accounts a
    where a.roblox_id in (select roblox_id from public.trackstat_accounts where id = any(p_ids))
  )
  , connected as (select id from public.trackstat_connected_accounts())
  select coalesce(array_agg(o.id), '{}')
  from seen o
  where cardinality(p_ids) <= 500 and o.id = any(p_ids)
    and o.last_seen < now() - interval '24 hours'
    -- A connected old key is only dropped when the newer key is connected too, so a user never ends up with no stored inventory
    and exists (select 1 from seen n where n.roblox_id = o.roblox_id and n.id <> o.id and n.last_seen > o.last_seen
      and (o.id not in (select id from connected) or n.id in (select id from connected)));
$$;
revoke all on function public.trackstat_superseded_accounts(uuid[]) from public;
grant execute on function public.trackstat_superseded_accounts(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
