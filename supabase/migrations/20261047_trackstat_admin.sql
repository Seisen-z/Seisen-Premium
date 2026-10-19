-- Read-only totals for the Trackstat admin page. Only the server-side service key can call these; the public keys cannot.
begin;

create or replace function public.trackstat_admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  with live as (
    select a.id, public.trackstat_active_games(a.id, a.presence, a.presence_sessions) g from public.trackstat_accounts a
  )
  select jsonb_build_object(
    'now', now(),
    'totals', jsonb_build_object(
      'accounts', (select count(*) from public.trackstat_accounts),
      'sessions', (select count(*) from public.trackstat_sessions),
      'website_users', (select count(distinct user_id) from public.trackstat_user_accounts),
      'linked_accounts', (select count(distinct account_id) from public.trackstat_user_accounts),
      'shares', (select count(*) from public.trackstat_shares),
      'live_now', (select count(*) from live where jsonb_array_length(g) > 0),
      'active_1h', (select count(distinct account_id) from public.trackstat_sessions where updated_at > now()-interval '1 hour'),
      'active_24h', (select count(distinct account_id) from public.trackstat_sessions where updated_at > now()-interval '24 hours'),
      'active_7d', (select count(distinct account_id) from public.trackstat_sessions where updated_at > now()-interval '7 days')),
    'new_accounts', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d), '[]') from (
        select days.d, (select count(*) from public.trackstat_accounts a where (a.created_at at time zone 'UTC')::date = days.d) n
        from generate_series((now() at time zone 'UTC')::date - 13, (now() at time zone 'UTC')::date, interval '1 day') days(d)) t),
    'daily_gains', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'game_id', game_id, 'gained', total) order by day), '[]') from (
        select day, game_id, (select sum(v::numeric) from jsonb_each_text(gained) e(k,v)) total
        from public.trackstat_daily_gains where day >= (now() at time zone 'UTC')::date - 13) t),
    'hourly_active', (select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'n', n) order by h), '[]') from (
        select date_trunc('hour', at) h, count(distinct account_id) n from public.trackstat_samples where at > now()-interval '72 hours' group by 1) t)
  ) into r;
  return r;
end $$;

create or replace function public.trackstat_admin_games()
returns jsonb language sql stable security definer set search_path = '' as $$
  with live as (select a.id, public.trackstat_active_games(a.id, a.presence, a.presence_sessions) g from public.trackstat_accounts a)
  select coalesce(jsonb_agg(jsonb_build_object(
    'game_id', gm,
    'accounts', (select count(distinct account_id) from public.trackstat_sessions s where s.game_id=gm),
    'live', (select count(*) from live where g ? gm),
    'active_24h', (select count(distinct account_id) from public.trackstat_sessions s where s.game_id=gm and s.updated_at > now()-interval '24 hours'),
    'sessions', (select count(*) from public.trackstat_sessions s where s.game_id=gm)) order by gm), '[]'::jsonb)
  from unnest(array['3317771874','10563114921','10708913337']) gm;
$$;

create or replace function public.trackstat_admin_accounts(p_limit integer default 1000)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(row order by last_sync desc nulls last), '[]'::jsonb) from (
    select a.id::text id, a.username, a.roblox_id, a.created_at,
      (select max(updated_at) from public.trackstat_sessions s where s.account_id=a.id) last_sync,
      public.trackstat_active_games(a.id, a.presence, a.presence_sessions) live,
      (select coalesce(jsonb_agg(distinct game_id), '[]') from public.trackstat_sessions s where s.account_id=a.id) games,
      (select count(*) from public.trackstat_sessions s where s.account_id=a.id) sessions,
      (select coalesce(sum((select sum(v::numeric) from jsonb_each_text(gained) e(k,v))), 0) from public.trackstat_daily_gains d where d.account_id=a.id and d.day=(now() at time zone 'UTC')::date) gained_today,
      (select count(*) from public.trackstat_user_accounts u where u.account_id=a.id) website_users
    from public.trackstat_accounts a limit greatest(1, least(coalesce(p_limit, 1000), 2000))) row;
$$;

create or replace function public.trackstat_admin_activity(p_limit integer default 100)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('account', account, 'username', username, 'game_id', game_id, 'name', name, 'kind', kind, 'gained', gained, 'at', at) order by at desc), '[]'::jsonb) from (
    select a.id::text account, a.username, s.game_id, d->>'name' name, d->>'kind' kind, (d->>'gained')::numeric gained, to_timestamp((d->>'t')::bigint) at
    from public.trackstat_sessions s
    join public.trackstat_accounts a on a.id = s.account_id
    cross join lateral jsonb_array_elements(s.snapshot->'details') d
    where s.updated_at > now()-interval '7 days' and d ? 't' and coalesce((d->>'gained')::numeric, 0) > 0
    order by (d->>'t')::bigint desc limit greatest(1, least(coalesce(p_limit, 100), 300))) t;
$$;

revoke all on function public.trackstat_admin_overview(), public.trackstat_admin_games(), public.trackstat_admin_accounts(integer), public.trackstat_admin_activity(integer) from public, anon, authenticated;
grant execute on function public.trackstat_admin_overview(), public.trackstat_admin_games(), public.trackstat_admin_accounts(integer), public.trackstat_admin_activity(integer) to service_role;

commit;
