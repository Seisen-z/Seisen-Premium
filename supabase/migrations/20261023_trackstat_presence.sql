begin;
alter table public.trackstat_accounts add column presence jsonb not null default '{}'::jsonb;

create function public.trackstat_heartbeat(p_key text, p_game text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_game is null or p_game not in ('3317771874', '10563114921') then raise exception 'Unsupported game'; end if;
  update public.trackstat_accounts set presence = jsonb_set(presence, array[p_game], to_jsonb(now()))
    where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if not found then raise exception 'Invalid connection key'; end if;
  return jsonb_build_object('active', true);
end $$;
revoke all on function public.trackstat_heartbeat(text,text) from public;
grant execute on function public.trackstat_heartbeat(text,text) to anon, authenticated;

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
  select coalesce(jsonb_agg(game_id), '[]'::jsonb) into active_games from (
    select key as game_id from jsonb_each_text(a.presence) where value::timestamptz > now() - interval '120 seconds'
    union
    select game_id from public.trackstat_sessions where account_id = a.id and updated_at > now() - interval '120 seconds'
  ) live_games;
  return jsonb_build_object('account', jsonb_build_object('username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions, 'activeGames',active_games);
end $function$
;
commit;
