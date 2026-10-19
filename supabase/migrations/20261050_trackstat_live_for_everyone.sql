-- Every account running the library counts as live (so we know how many use it per game); only accounts connected on the website
-- get their data stored (sessions, gains, inventory). Presence is saved for everyone; syncs are skipped for unconnected accounts while enforcement is on.
begin;

do $$
declare def text;
  pres_old constant text := $x$if a.id is null then raise exception 'Invalid connection key'; end if;$x$;
  pres_new constant text := pres_old || E'\n  if public.trackstat_enforcing() and not public.trackstat_is_connected(a.id) then return jsonb_build_object(''active'', p_active, ''connected'', false); end if;';
begin
  def := pg_get_functiondef('public.trackstat_presence(text,uuid,text,boolean)'::regprocedure);
  if (length(def) - length(replace(def, pres_new, ''))) / length(pres_new) <> 1 then raise exception 'trackstat_presence: enforcement line not found once'; end if;
  execute replace(def, pres_new, pres_old);
end $$;

-- Library activity across ALL accounts (presence), next to the data kept for connected accounts
create or replace function public.trackstat_admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  with linked as (select id, linked_at from public.trackstat_connected_accounts()),
  seen as (
    select a.id, public.trackstat_active_games(a.id, a.presence, a.presence_sessions) g,
      (select max((v->>'seen_at')::timestamptz) from jsonb_each(a.presence_sessions) e(k, v)) last_seen
    from public.trackstat_accounts a
  )
  select jsonb_build_object(
    'now', now(),
    'totals', jsonb_build_object(
      'libraries', (select count(*) from public.trackstat_accounts),
      'libraries_live', (select count(*) from seen where jsonb_array_length(g) > 0),
      'libraries_24h', (select count(*) from seen where last_seen > now()-interval '24 hours'),
      'libraries_7d', (select count(*) from seen where last_seen > now()-interval '7 days'),
      'accounts', (select count(*) from linked),
      'sessions', (select count(*) from public.trackstat_sessions s join linked l on l.id = s.account_id),
      'website_users', (select count(distinct user_id) from public.trackstat_user_accounts),
      'shares', (select count(*) from public.trackstat_shares s join linked l on l.id = s.account_id),
      'live_now', (select count(*) from seen join linked l on l.id = seen.id where jsonb_array_length(g) > 0),
      'active_1h', (select count(distinct s.account_id) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.updated_at > now()-interval '1 hour'),
      'active_24h', (select count(distinct s.account_id) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.updated_at > now()-interval '24 hours'),
      'active_7d', (select count(distinct s.account_id) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.updated_at > now()-interval '7 days')),
    'new_accounts', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d), '[]') from (
        select days.d, (select count(*) from linked l where (l.linked_at at time zone 'UTC')::date = days.d) n
        from generate_series((now() at time zone 'UTC')::date - 13, (now() at time zone 'UTC')::date, interval '1 day') days(d)) t),
    'daily_gains', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'game_id', game_id, 'gained', total) order by day), '[]') from (
        select g.day, g.game_id, (select sum(v::numeric) from jsonb_each_text(g.gained) e(k,v)) total
        from public.trackstat_daily_gains g join linked l on l.id = g.account_id where g.day >= (now() at time zone 'UTC')::date - 13) t),
    'hourly_active', (select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'n', n) order by h), '[]') from (
        select date_trunc('hour', m.at) h, count(distinct m.account_id) n from public.trackstat_samples m join linked l on l.id = m.account_id where m.at > now()-interval '72 hours' group by 1) t)
  ) into r;
  return r;
end $$;

create or replace function public.trackstat_admin_games()
returns jsonb language sql stable security definer set search_path = '' as $$
  with linked as (select id from public.trackstat_connected_accounts()),
  seen as (select a.id, a.presence_sessions, public.trackstat_active_games(a.id, a.presence, a.presence_sessions) g from public.trackstat_accounts a)
  select coalesce(jsonb_agg(jsonb_build_object(
    'game_id', gm,
    'libraries_live', (select count(*) from seen where g ? gm),
    'libraries_24h', (select count(*) from seen where exists (select 1 from jsonb_each(seen.presence_sessions) e(k, v) where v->>'game' = gm and (v->>'seen_at')::timestamptz > now()-interval '24 hours')),
    'accounts', (select count(distinct s.account_id) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.game_id=gm),
    'live', (select count(*) from seen join linked l on l.id = seen.id where g ? gm),
    'active_24h', (select count(distinct s.account_id) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.game_id=gm and s.updated_at > now()-interval '24 hours'),
    'sessions', (select count(*) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.game_id=gm)) order by gm), '[]'::jsonb)
  from unnest(array['3317771874','10563114921','10708913337']) gm;
$$;

commit;
