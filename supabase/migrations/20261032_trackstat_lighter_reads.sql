begin;

-- Only each game's newest session carries its full inventory; older sessions keep their gains and details.
CREATE OR REPLACE FUNCTION public.trackstat_private_data(p_account uuid)
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
      (case when s.id = (select l.id from public.trackstat_sessions l where l.account_id=a.id and l.game_id=s.game_id order by l.updated_at desc, l.id desc limit 1)
        then to_jsonb(s) else jsonb_set(to_jsonb(s), '{snapshot}', s.snapshot - 'inventory') end)
      - 'account_id' - 'daily_checkpoint' || jsonb_build_object('history_expired', s.updated_at <= now()-interval '8 days') order by s.updated_at desc), '[]'::jsonb) into sessions
    from (
      (select * from public.trackstat_sessions where account_id=a.id and updated_at > now()-interval '8 days' order by updated_at desc limit 50)
      union
      (select distinct on (game_id) * from public.trackstat_sessions where account_id=a.id order by game_id, updated_at desc, id desc)
    ) s;
  active_games := public.trackstat_active_games(a.id, a.presence, a.presence_sessions);
  select coalesce(jsonb_agg(jsonb_build_object('day',day,'game_id',game_id,'gained',gained) order by day,game_id),'[]'::jsonb) into daily from public.trackstat_daily_gains where account_id=a.id and day >= (now() at time zone 'UTC')::date-7;
  return jsonb_build_object('account', jsonb_build_object('id',a.id,'username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions, 'activeGames',active_games,'daily',daily);
end $function$;

-- Accounts the browser already loads through its own keys are skipped, so nothing is fetched twice.
drop function public.trackstat_user_accounts_read();
create function public.trackstat_user_accounts_read(p_skip_keys text[] default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if cardinality(p_skip_keys) > 60 then raise exception 'Too many keys'; end if;
 return (select coalesce(jsonb_agg(public.trackstat_private_data(ua.account_id) order by ua.created_at, ua.account_id),'[]'::jsonb)
 from public.trackstat_user_accounts ua
 where ua.user_id=auth.uid()
 and not exists(select 1 from public.trackstat_accounts k
   where k.id=ua.account_id and k.key_hash in (select encode(extensions.digest(x,'sha256'),'hex') from unnest(p_skip_keys) x)));
end $$;
revoke all on function public.trackstat_user_accounts_read(text[]) from public,anon;
grant execute on function public.trackstat_user_accounts_read(text[]) to authenticated;

notify pgrst, 'reload schema';
commit;
