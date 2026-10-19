-- An account that saved a sync in the last 120 seconds is live, unless the library explicitly closed that game after it.
-- The heartbeat still counts on its own, so either signal is enough.
begin;

create or replace function public.trackstat_active_games(p_account uuid,p_presence jsonb,p_sessions jsonb)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(distinct game_id),'[]'::jsonb) from (
    select value->>'game' as game_id from jsonb_each(p_sessions)
      where value->>'active'='true' and (value->>'seen_at')::timestamptz > now()-interval '120 seconds'
    union
    select key from jsonb_each_text(p_presence) legacy
      where value::timestamptz > now()-interval '120 seconds'
      and not exists(select 1 from jsonb_each(p_sessions) p where p.value->>'game'=legacy.key)
    union
    select s.game_id from public.trackstat_sessions s
      where s.account_id=p_account and s.updated_at > now()-interval '120 seconds'
      and not exists(select 1 from jsonb_each(p_sessions) p
        where p.value->>'game'=s.game_id and p.value->>'active'='false' and (p.value->>'seen_at')::timestamptz > s.updated_at-interval '20 seconds')
  ) active;
$$;

commit;
