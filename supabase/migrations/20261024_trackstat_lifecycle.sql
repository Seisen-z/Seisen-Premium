begin;
alter table public.trackstat_accounts add column presence_sessions jsonb not null default '{}'::jsonb;

-- Each library execution owns its own presence record. A closed record is terminal.
create function public.trackstat_presence(p_key text, p_session uuid, p_game text, p_active boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.trackstat_accounts; records jsonb; current_record jsonb;
begin
  if p_game is null or p_game not in ('3317771874','10563114921') or p_session is null or p_active is null then raise exception 'Invalid presence'; end if;
  select * into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key,'sha256'),'hex') for update;
  if a.id is null then raise exception 'Invalid connection key'; end if;
  current_record := a.presence_sessions -> p_session::text;
  if current_record is not null and current_record->>'game' <> p_game then raise exception 'Session mismatch'; end if;
  if current_record->>'active' = 'false' then return jsonb_build_object('active',false); end if;
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into records from jsonb_each(a.presence_sessions)
    where (value->>'seen_at')::timestamptz > now()-interval '8 days';
  records := jsonb_set(records,array[p_session::text],jsonb_build_object('game',p_game,'active',p_active,'seen_at',now()));
  update public.trackstat_accounts set presence_sessions=records where id=a.id;
  return jsonb_build_object('active',p_active);
end $$;
revoke all on function public.trackstat_presence(text,uuid,text,boolean) from public;
grant execute on function public.trackstat_presence(text,uuid,text,boolean) to anon,authenticated;

-- Old libraries keep working, but only new executions can explicitly close their presence.
create or replace function public.trackstat_heartbeat(p_key text,p_game text)
returns jsonb language sql security definer set search_path = '' as $$
  select public.trackstat_presence(p_key,md5('legacy:'||p_game)::uuid,p_game,true);
$$;

create function public.trackstat_active_games(p_account uuid,p_presence jsonb,p_sessions jsonb)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(distinct game_id),'[]'::jsonb) from (
    select value->>'game' as game_id from jsonb_each(p_sessions)
      where value->>'active'='true' and (value->>'seen_at')::timestamptz > now()-interval '120 seconds'
    union
    select key from jsonb_each_text(p_presence) legacy
      where value::timestamptz > now()-interval '120 seconds'
      and not exists(select 1 from jsonb_each(p_sessions) p where p.value->>'game'=legacy.key)
    union
    select s.game_id from public.trackstat_sessions s where s.account_id=p_account and s.updated_at>now()-interval '120 seconds'
      and not (p_presence ? s.game_id)
      and not exists(select 1 from jsonb_each(p_sessions) p where p.value->>'game'=s.game_id)
  ) active;
$$;
revoke all on function public.trackstat_active_games(uuid,jsonb,jsonb) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.trackstat_private(p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a public.trackstat_accounts; sessions jsonb; active_games jsonb;
begin
  select * into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if a.id is null then raise exception 'Invalid connection key'; end if;
  select coalesce(jsonb_agg(to_jsonb(s) - 'account_id' || jsonb_build_object('history_expired', s.updated_at <= now()-interval '8 days') order by s.updated_at desc), '[]'::jsonb) into sessions
    from (
      (select * from public.trackstat_sessions where account_id=a.id and updated_at > now()-interval '8 days' order by updated_at desc limit 50)
      union
      (select distinct on (game_id) * from public.trackstat_sessions where account_id=a.id order by game_id, updated_at desc, id desc)
    ) s;
  active_games := public.trackstat_active_games(a.id, a.presence, a.presence_sessions);
  return jsonb_build_object('account', jsonb_build_object('username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions, 'activeGames',active_games);
end $function$
;
CREATE OR REPLACE FUNCTION public.trackstat_public()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('game','Pet Simulator 99', 'accounts', count(distinct account_id), 'sessions',count(*),
    'live', (select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '3317771874'),
    'gained', jsonb_build_object(
      'items',coalesce(sum((snapshot #>> '{gained,items}')::numeric),0),
      'huge',coalesce(sum((snapshot #>> '{gained,huge}')::numeric),0),
      'titanic',coalesce(sum((snapshot #>> '{gained,titanic}')::numeric),0),
      'gargantuan',coalesce(sum((snapshot #>> '{gained,gargantuan}')::numeric),0)))
  from public.trackstat_sessions where game_id = '3317771874' and updated_at > now() - interval '8 days';
$function$
;
CREATE OR REPLACE FUNCTION public.trackstats_stealanegg_public()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('game','Steal An Egg', 'accounts', count(distinct account_id), 'sessions',count(*),
    'live', (select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '10563114921'),
    'gained', jsonb_build_object(
      'pets',coalesce(sum((snapshot #>> '{gained,pets}')::numeric),0),
      'eggs',coalesce(sum((snapshot #>> '{gained,eggs}')::numeric),0),
      'gear',coalesce(sum((snapshot #>> '{gained,gear}')::numeric),0),
      'items',coalesce(sum((snapshot #>> '{gained,items}')::numeric),0)))
  from public.trackstat_sessions where game_id = '10563114921' and updated_at > now() - interval '8 days';
$function$
;
notify pgrst, 'reload schema';
commit;
