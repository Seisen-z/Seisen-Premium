begin;

-- Keep the latest inventory for each account/game, even after its activity expires.
create function public.trackstat_prune_history()
returns void language plpgsql security definer set search_path = '' as $$
declare cutoff timestamptz := now() - interval '8 days';
begin
  delete from public.trackstat_sessions s
  where s.updated_at <= cutoff and exists (
    select 1 from public.trackstat_sessions newer
    where newer.account_id = s.account_id and newer.game_id = s.game_id
      and (newer.updated_at, newer.id) > (s.updated_at, s.id)
  );
  update public.trackstat_sessions s
  set snapshot = s.snapshot || jsonb_build_object(
    'gained', (select jsonb_object_agg(k, 0) from jsonb_object_keys(s.snapshot->'gained') k),
    'details', '[]'::jsonb)
  where s.updated_at <= cutoff and (
    s.snapshot->'details' <> '[]'::jsonb or exists (
      select 1 from jsonb_each_text(s.snapshot->'gained') g where g.value::numeric <> 0
    )
  );
end $$;
revoke all on function public.trackstat_prune_history() from public, anon, authenticated;

create or replace function public.trackstat_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Pet Simulator 99', 'accounts', count(distinct account_id), 'sessions',count(*),
    'live', count(distinct account_id) filter(where updated_at > now()-interval '90 seconds'),
    'gained', jsonb_build_object(
      'items',coalesce(sum((snapshot #>> '{gained,items}')::numeric),0),
      'huge',coalesce(sum((snapshot #>> '{gained,huge}')::numeric),0),
      'titanic',coalesce(sum((snapshot #>> '{gained,titanic}')::numeric),0),
      'gargantuan',coalesce(sum((snapshot #>> '{gained,gargantuan}')::numeric),0)))
  from public.trackstat_sessions where game_id = '3317771874' and updated_at > now() - interval '8 days';
$$;

create or replace function public.trackstats_stealanegg_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Steal An Egg', 'accounts', count(distinct account_id), 'sessions',count(*),
    'live', count(distinct account_id) filter(where updated_at > now()-interval '90 seconds'),
    'gained', jsonb_build_object(
      'pets',coalesce(sum((snapshot #>> '{gained,pets}')::numeric),0),
      'eggs',coalesce(sum((snapshot #>> '{gained,eggs}')::numeric),0),
      'gear',coalesce(sum((snapshot #>> '{gained,gear}')::numeric),0),
      'items',coalesce(sum((snapshot #>> '{gained,items}')::numeric),0)))
  from public.trackstat_sessions where game_id = '10563114921' and updated_at > now() - interval '8 days';
$$;

create or replace function public.trackstat_private(p_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.trackstat_accounts; sessions jsonb;
begin
  select * into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if a.id is null then raise exception 'Invalid connection key'; end if;
  select coalesce(jsonb_agg(to_jsonb(s) - 'account_id' || jsonb_build_object('history_expired', s.updated_at <= now()-interval '8 days') order by s.updated_at desc), '[]'::jsonb) into sessions
    from (
      (select * from public.trackstat_sessions where account_id=a.id and updated_at > now()-interval '8 days' order by updated_at desc limit 50)
      union
      (select distinct on (game_id) * from public.trackstat_sessions where account_id=a.id order by game_id, updated_at desc, id desc)
    ) s;
  return jsonb_build_object('account', jsonb_build_object('username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions);
end $$;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('trackstat-retention', '0 * * * *', $job$
  select public.trackstat_prune_history();
  delete from cron.job_run_details
  where jobid = (select jobid from cron.job where jobname = 'trackstat-retention')
    and end_time <= now() - interval '8 days';
$job$);
select public.trackstat_prune_history();
notify pgrst, 'reload schema';
commit;
