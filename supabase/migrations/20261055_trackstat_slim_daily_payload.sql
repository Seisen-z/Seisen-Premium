-- Daily details replace raw session lists; historical rows retain only timing.
begin;
CREATE OR REPLACE FUNCTION public.trackstat_private_data(p_account uuid, p_slim boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a public.trackstat_accounts; sessions jsonb; active_games jsonb; daily jsonb;
begin
  select * into a from public.trackstat_accounts where id = p_account;
  if a.id is null then raise exception 'Invalid connection key'; end if;
  select coalesce(jsonb_agg(
      (case
        when not (s.id = (select l.id from public.trackstat_sessions l where l.account_id=a.id and l.game_id=s.game_id order by l.updated_at desc, l.id desc limit 1))
          then jsonb_build_object('id',s.id,'game_id',s.game_id,'started_at',s.started_at,'updated_at',s.updated_at,'snapshot',jsonb_build_object('owned','{}'::jsonb,'gained','{}'::jsonb,'details','[]'::jsonb))
        when p_slim
          then jsonb_set(to_jsonb(s), '{snapshot}', (s.snapshot - 'inventory' - 'details') || jsonb_build_object('details','[]'::jsonb,'inventory_value', public.trackstat_inventory_value(s.snapshot), 'has_inventory', ((jsonb_typeof(s.snapshot->'inventory')='array' and jsonb_array_length(s.snapshot->'inventory')>0) or coalesce((s.snapshot->>'has_inventory')::boolean,false))))
        else jsonb_set(to_jsonb(s),'{snapshot}',(s.snapshot-'details')||jsonb_build_object('details','[]'::jsonb)) end)
      - 'account_id' - 'daily_checkpoint' - 'activity_checkpoint' || jsonb_build_object('history_expired', s.updated_at <= now()-interval '7 days') order by s.updated_at desc,s.id desc), '[]'::jsonb) into sessions
    from (
      (select * from public.trackstat_sessions where account_id=a.id and updated_at > now()-interval '7 days' order by updated_at desc limit 50)
      union
      (select distinct on (game_id) * from public.trackstat_sessions where account_id=a.id order by game_id, updated_at desc, id desc)
    ) s;
  active_games := public.trackstat_active_games(a.id, a.presence, a.presence_sessions);
  select coalesce(jsonb_agg(jsonb_build_object('day',day,'game_id',game_id,'gained',gained,'details',coalesce((select jsonb_agg(jsonb_build_object('kind',activity.kind,'name',activity.name,'gained',activity.gained,'owned',activity.owned,'t',extract(epoch from activity.at)::bigint) order by activity.at desc) from public.trackstat_daily_activity activity where activity.account_id=p_account and activity.game_id=trackstat_daily_gains.game_id and activity.day=trackstat_daily_gains.day),'[]'::jsonb)) order by day,game_id),'[]'::jsonb) into daily from public.trackstat_daily_gains where account_id=a.id and day >= (now() at time zone 'UTC')::date-6;
  return jsonb_build_object('account', jsonb_build_object('id',a.id,'username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions, 'activeGames',active_games,'daily',daily);
end $function$;

revoke all on function public.trackstat_private_data(uuid,boolean) from public,anon,authenticated;
do $$
declare def text;
begin
 def:=pg_get_functiondef('public.trackstat_version(text[])'::regprocedure);
 if strpos(def,'daily-activity-v1:')=0 and strpos(def,'daily-activity-v2:')=0 and strpos(def,'daily-activity-v3:')=0 then raise exception 'Daily cache version missing';end if;
 execute replace(replace(def,'daily-activity-v1:','daily-activity-v3:'),'daily-activity-v2:','daily-activity-v3:');
end $$;
notify pgrst,'reload schema';
commit;
