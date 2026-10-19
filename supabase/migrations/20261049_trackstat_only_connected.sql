-- Only accounts connected on the website get their data stored. "Connected" = the key was submitted on the website (logged in or not)
-- or linked to a website login. Enforcement is a switch (trackstat_config only_connected) that ships OFF, so applying this changes nothing
-- until the website records key submissions. Turn it on with: update public.trackstat_config set value='on' where key='only_connected';
begin;

create table if not exists public.trackstat_config (key text primary key, value text not null);
alter table public.trackstat_config enable row level security; -- no policies: only the functions below read it
insert into public.trackstat_config values ('only_connected', 'off') on conflict do nothing;

alter table public.trackstat_accounts add column if not exists website_seen_at timestamptz;
update public.trackstat_accounts a set website_seen_at = now()
  where website_seen_at is null and exists (select 1 from public.trackstat_user_accounts u where u.account_id = a.id);

create or replace function public.trackstat_enforcing()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select value from public.trackstat_config where key = 'only_connected'), 'off') = 'on';
$$;

create or replace function public.trackstat_connected_accounts()
returns table (id uuid, linked_at timestamptz) language sql stable security definer set search_path = '' as $$
  select a.id, coalesce(a.website_seen_at, (select min(u.created_at) from public.trackstat_user_accounts u where u.account_id = a.id))
  from public.trackstat_accounts a
  where a.website_seen_at is not null or exists (select 1 from public.trackstat_user_accounts u where u.account_id = a.id);
$$;

create or replace function public.trackstat_is_connected(p_account uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trackstat_connected_accounts() c where c.id = p_account);
$$;

-- The website calls this with the keys a visitor has submitted; it is throttled to once per 6 hours per account
create or replace function public.trackstat_site_seen(p_keys text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_keys is null or cardinality(p_keys) = 0 then return; end if;
  if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
  update public.trackstat_accounts set website_seen_at = now()
  where key_hash in (select encode(extensions.digest(k, 'sha256'), 'hex') from unnest(p_keys) k)
    and (website_seen_at is null or website_seen_at < now() - interval '6 hours');
end $$;

-- The Trackstat server asks this for every inventory it is sent: which account the key belongs to, and whether to store anything
create or replace function public.trackstat_key_status(p_key text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('account', a.id, 'connected', (not public.trackstat_enforcing()) or public.trackstat_is_connected(a.id))
  from public.trackstat_accounts a where a.key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
$$;

revoke all on function public.trackstat_enforcing(), public.trackstat_connected_accounts(), public.trackstat_is_connected(uuid), public.trackstat_site_seen(text[]), public.trackstat_key_status(text) from public, anon, authenticated;
grant execute on function public.trackstat_site_seen(text[]), public.trackstat_key_status(text) to anon, authenticated;
grant execute on function public.trackstat_enforcing(), public.trackstat_connected_accounts(), public.trackstat_is_connected(uuid) to service_role;

-- Syncs and heartbeats from accounts that are not connected are answered but not saved (only while enforcement is on)
do $$
declare def text;
  push_old constant text := $x$if a is null then raise exception 'Invalid connection key'; end if;$x$;
  push_new constant text := push_old || E'\n  if public.trackstat_enforcing() and not public.trackstat_is_connected(a) then return jsonb_build_object(''accepted'', true, ''connected'', false); end if;';
  pres_old constant text := $x$if a.id is null then raise exception 'Invalid connection key'; end if;$x$;
  pres_new constant text := pres_old || E'\n  if public.trackstat_enforcing() and not public.trackstat_is_connected(a.id) then return jsonb_build_object(''active'', p_active, ''connected'', false); end if;';
begin
  def := pg_get_functiondef('public.trackstat_push(text,uuid,bigint,text,jsonb)'::regprocedure);
  if (length(def) - length(replace(def, push_old, ''))) / length(push_old) <> 1 then raise exception 'trackstat_push: anchor not found once'; end if;
  execute replace(def, push_old, push_new);

  def := pg_get_functiondef('public.trackstat_presence(text,uuid,text,boolean)'::regprocedure);
  if (length(def) - length(replace(def, pres_old, ''))) / length(pres_old) <> 1 then raise exception 'trackstat_presence: anchor not found once'; end if;
  execute replace(def, pres_old, pres_new);
end $$;

-- The admin page lists accounts connected on the website, logged in or not
create or replace function public.trackstat_admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  with linked as (select id, linked_at from public.trackstat_connected_accounts()),
  live as (
    select a.id, public.trackstat_active_games(a.id, a.presence, a.presence_sessions) g from public.trackstat_accounts a join linked l on l.id = a.id
  )
  select jsonb_build_object(
    'now', now(),
    'totals', jsonb_build_object(
      'accounts', (select count(*) from linked),
      'sessions', (select count(*) from public.trackstat_sessions s join linked l on l.id = s.account_id),
      'website_users', (select count(distinct user_id) from public.trackstat_user_accounts),
      'shares', (select count(*) from public.trackstat_shares s join linked l on l.id = s.account_id),
      'live_now', (select count(*) from live where jsonb_array_length(g) > 0),
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
  live as (select a.id, public.trackstat_active_games(a.id, a.presence, a.presence_sessions) g from public.trackstat_accounts a join linked l on l.id = a.id)
  select coalesce(jsonb_agg(jsonb_build_object(
    'game_id', gm,
    'accounts', (select count(distinct s.account_id) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.game_id=gm),
    'live', (select count(*) from live where g ? gm),
    'active_24h', (select count(distinct s.account_id) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.game_id=gm and s.updated_at > now()-interval '24 hours'),
    'sessions', (select count(*) from public.trackstat_sessions s join linked l on l.id = s.account_id where s.game_id=gm)) order by gm), '[]'::jsonb)
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
    from public.trackstat_accounts a
    where exists (select 1 from public.trackstat_connected_accounts() c where c.id = a.id)
    limit greatest(1, least(coalesce(p_limit, 1000), 2000))) row;
$$;

create or replace function public.trackstat_admin_activity(p_limit integer default 100)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('account', account, 'username', username, 'game_id', game_id, 'name', name, 'kind', kind, 'gained', gained, 'at', at) order by at desc), '[]'::jsonb) from (
    select a.id::text account, a.username, s.game_id, d->>'name' name, d->>'kind' kind, (d->>'gained')::numeric gained, to_timestamp((d->>'t')::bigint) at
    from public.trackstat_sessions s
    join public.trackstat_accounts a on a.id = s.account_id
    cross join lateral jsonb_array_elements(s.snapshot->'details') d
    where s.updated_at > now()-interval '7 days' and d ? 't' and coalesce((d->>'gained')::numeric, 0) > 0
      and exists (select 1 from public.trackstat_connected_accounts() c where c.id = a.id)
    order by (d->>'t')::bigint desc limit greatest(1, least(coalesce(p_limit, 100), 300))) t;
$$;

commit;
