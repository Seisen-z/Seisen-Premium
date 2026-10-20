-- Community totals count every account that played a game, whether or not its key was ever submitted on the website.
-- For that, each session leaves one tiny anonymous row here: the game, the gain totals and the timestamps. No inventory, no item list, no history.
-- The community functions read from this table, and a reset or delete of the account removes its rows (cascade).
begin;

create table if not exists public.trackstat_community (
  session_id uuid primary key,
  account_id uuid not null references public.trackstat_accounts (id) on delete cascade,
  game_id text not null,
  gained jsonb not null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trackstat_community_game on public.trackstat_community (game_id, updated_at);
alter table public.trackstat_community enable row level security; -- no policies: only the functions below touch it

create or replace function public.trackstat_community_record(p_account uuid, p_session uuid, p_game text, p_snapshot jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare metrics text[]; g jsonb := '{}'::jsonb; m text; v numeric;
begin
  if p_account is null or p_session is null or p_game is null or p_game not in ('3317771874','10563114921','10708913337') or jsonb_typeof(p_snapshot->'gained') is distinct from 'object' then return; end if;
  metrics := case p_game when '3317771874' then array['items','huge','titanic','gargantuan'] when '10708913337' then array['units','boosts','gear','items'] else array['pets','eggs','gear','items'] end;
  foreach m in array metrics loop
    v := case when jsonb_typeof(p_snapshot->'gained'->m) = 'number' then (p_snapshot->'gained'->>m)::numeric else 0 end;
    g := jsonb_set(g, array[m], to_jsonb(greatest(v, 0)));
  end loop;
  insert into public.trackstat_community as c (session_id, account_id, game_id, gained) values (p_session, p_account, p_game, g)
  on conflict (session_id) do update
    set gained = (select jsonb_object_agg(k, greatest(coalesce((c.gained->>k)::numeric, 0), (excluded.gained->>k)::numeric)) from jsonb_object_keys(excluded.gained) k),
        updated_at = now()
    where c.account_id = excluded.account_id;
exception when others then null; -- the community numbers must never break a sync
end $$;
revoke all on function public.trackstat_community_record(uuid, uuid, text, jsonb) from public, anon, authenticated;

-- What exists today keeps counting: the last 7 days of sessions
insert into public.trackstat_community (session_id, account_id, game_id, gained, started_at, updated_at)
select id, account_id, game_id, snapshot->'gained', started_at, updated_at from public.trackstat_sessions
where updated_at > now() - interval '7 days' and jsonb_typeof(snapshot->'gained') = 'object'
on conflict do nothing;

-- Every sync is counted for the community, before anything decides whether the account's own data is kept
do $$
declare def text;
  old constant text := $x$if public.trackstat_enforcing() and not public.trackstat_is_connected(a) then return jsonb_build_object('accepted', true, 'connected', false); end if;$x$;
  new constant text := E'perform public.trackstat_community_record(a, p_session, p_game, p_snapshot);\n  ' || old;
begin
  def := pg_get_functiondef('public.trackstat_push(text,uuid,bigint,text,jsonb)'::regprocedure);
  if (length(def) - length(replace(def, old, ''))) / length(old) <> 1 then raise exception 'trackstat_push: enforcement line not found once'; end if;
  execute replace(def, old, new);
end $$;

create or replace function public.trackstat_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Pet Simulator 99', 'accounts', count(distinct account_id), 'sessions', count(*),
    'live', (select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '3317771874'),
    'gained', jsonb_build_object(
      'items', coalesce(sum((gained->>'items')::numeric), 0),
      'huge', coalesce(sum((gained->>'huge')::numeric), 0),
      'titanic', coalesce(sum((gained->>'titanic')::numeric), 0),
      'gargantuan', coalesce(sum((gained->>'gargantuan')::numeric), 0)))
  from public.trackstat_community where game_id = '3317771874' and updated_at > now() - interval '7 days';
$$;

create or replace function public.trackstats_stealanegg_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Steal An Egg', 'accounts', count(distinct account_id), 'sessions', count(*),
    'live', (select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '10563114921'),
    'gained', jsonb_build_object(
      'pets', coalesce(sum((gained->>'pets')::numeric), 0),
      'eggs', coalesce(sum((gained->>'eggs')::numeric), 0),
      'gear', coalesce(sum((gained->>'gear')::numeric), 0),
      'items', coalesce(sum((gained->>'items')::numeric), 0)))
  from public.trackstat_community where game_id = '10563114921' and updated_at > now() - interval '7 days';
$$;

create or replace function public.trackstats_animedice_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Anime Dice', 'accounts', count(distinct account_id), 'sessions', count(*),
    'live', (select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '10708913337'),
    'gained', jsonb_build_object(
      'units', coalesce(sum((gained->>'units')::numeric), 0),
      'boosts', coalesce(sum((gained->>'boosts')::numeric), 0),
      'gear', coalesce(sum((gained->>'gear')::numeric), 0),
      'items', coalesce(sum((gained->>'items')::numeric), 0)))
  from public.trackstat_community where game_id = '10708913337' and updated_at > now() - interval '7 days';
$$;

select cron.schedule('trackstat-community-prune', '15 * * * *', $job$delete from public.trackstat_community where updated_at < now() - interval '7 days'$job$);

commit;
