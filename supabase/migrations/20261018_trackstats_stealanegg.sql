begin;

-- Sessions can now come from Steal An Egg (universe 10563114921) as well as Pet Simulator 99.
alter table public.trackstat_sessions drop constraint trackstat_sessions_game_id_check;
alter table public.trackstat_sessions add constraint trackstat_sessions_game_id_check check (game_id in ('3317771874', '10563114921'));

-- One catalog table per game.
create table public.trackstats_stealanegg (
  key text primary key check (length(key) between 1 and 120),
  kind text not null check (kind in ('pet', 'egg', 'gear', 'item')),
  name text not null check (length(name) between 1 and 100),
  icon text check (icon ~ '^[0-9]{1,20}$'),
  rarity text check (length(rarity) <= 30),
  rarity_num integer,
  rarity_color text check (rarity_color ~ '^#[0-9a-f]{6}$'),
  description text check (length(description) <= 300),
  created_at timestamptz not null default now()
);
alter table public.trackstats_stealanegg enable row level security;
revoke all on public.trackstats_stealanegg from public, anon, authenticated;

create function public.trackstats_stealanegg_catalog_missing(p_keys text[])
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(k), '{}') from unnest(p_keys[1:2000]) k
  where not exists (select 1 from public.trackstats_stealanegg c where c.key = k);
$$;

create function public.trackstats_stealanegg_catalog_add(p_key text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i jsonb; n integer := 0;
begin
  if not exists (select 1 from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')) then raise exception 'Invalid connection key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'Invalid items'; end if;
  for i in select * from jsonb_array_elements(p_items) loop
    insert into public.trackstats_stealanegg(key, kind, name, icon, rarity, rarity_num, rarity_color, description)
    values (i->>'key', i->>'kind', i->>'name', nullif(i->>'icon', ''), i->>'rarity', (i->>'rarity_num')::integer, i->>'rarity_color', i->>'description')
    on conflict (key) do nothing;
    n := n + 1;
  end loop;
  return jsonb_build_object('received', n);
end $$;

create function public.trackstats_stealanegg_catalog_read(p_keys text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.key, to_jsonb(c) - 'key' - 'created_at'), '{}'::jsonb)
  from public.trackstats_stealanegg c where c.key = any (p_keys[1:2000]);
$$;

-- Pushes validate the counters of whichever game the session belongs to.
create or replace function public.trackstat_push(p_key text, p_session uuid, p_sequence bigint, p_game text, p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a uuid; metric text; side text; n numeric; old public.trackstat_sessions; metrics text[];
begin
  select id into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') for share;
  if a is null then raise exception 'Invalid connection key'; end if;
  if p_game is null or p_game not in ('3317771874', '10563114921') or p_sequence is null or p_sequence < 1 then raise exception 'Invalid session'; end if;
  metrics := case p_game when '3317771874' then array['items','huge','titanic','gargantuan'] else array['pets','eggs','gear','items'] end;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' or octet_length(p_snapshot::text) > 200000 then raise exception 'Invalid snapshot'; end if;
  foreach side in array array['owned','gained'] loop
    foreach metric in array metrics loop
      n := (p_snapshot #>> array[side,metric])::numeric;
      if n is null or n < 0 or n > 1000000000000000 or n <> trunc(n) then raise exception 'Invalid count'; end if;
    end loop;
  end loop;
  if jsonb_typeof(p_snapshot->'details') is distinct from 'array' or jsonb_array_length(p_snapshot->'details') > 500 then raise exception 'Invalid details'; end if;
  if p_snapshot ? 'inventory' and (jsonb_typeof(p_snapshot->'inventory') <> 'array' or jsonb_array_length(p_snapshot->'inventory') > 1000) then raise exception 'Invalid inventory'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_session::text, 0));
  select * into old from public.trackstat_sessions where id = p_session;
  if old.id is not null then
    if old.account_id <> a or old.game_id <> p_game then raise exception 'Session mismatch'; end if;
    if p_sequence <= old.sequence then return jsonb_build_object('accepted', false, 'sequence', old.sequence); end if;
    foreach metric in array metrics loop
      if (p_snapshot #>> array['gained',metric])::numeric < (old.snapshot #>> array['gained',metric])::numeric then raise exception 'Session totals must increase'; end if;
    end loop;
  end if;
  insert into public.trackstat_sessions(id,account_id,game_id,sequence,snapshot)
    values(p_session,a,p_game,p_sequence,p_snapshot)
    on conflict(id) do update set sequence=excluded.sequence, snapshot=excluded.snapshot, updated_at=now();
  return jsonb_build_object('accepted', true, 'sequence', p_sequence);
end $$;

-- Pet Simulator 99 community totals must not count other games' sessions.
create or replace function public.trackstat_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Pet Simulator 99', 'accounts', count(distinct account_id), 'sessions',count(*),
    'live', count(distinct account_id) filter(where updated_at > now()-interval '90 seconds'),
    'gained', jsonb_build_object(
      'items',coalesce(sum((snapshot #>> '{gained,items}')::numeric),0),
      'huge',coalesce(sum((snapshot #>> '{gained,huge}')::numeric),0),
      'titanic',coalesce(sum((snapshot #>> '{gained,titanic}')::numeric),0),
      'gargantuan',coalesce(sum((snapshot #>> '{gained,gargantuan}')::numeric),0)))
  from public.trackstat_sessions where game_id = '3317771874';
$$;

create function public.trackstats_stealanegg_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Steal An Egg', 'accounts', count(distinct account_id), 'sessions',count(*),
    'live', count(distinct account_id) filter(where updated_at > now()-interval '90 seconds'),
    'gained', jsonb_build_object(
      'pets',coalesce(sum((snapshot #>> '{gained,pets}')::numeric),0),
      'eggs',coalesce(sum((snapshot #>> '{gained,eggs}')::numeric),0),
      'gear',coalesce(sum((snapshot #>> '{gained,gear}')::numeric),0),
      'items',coalesce(sum((snapshot #>> '{gained,items}')::numeric),0)))
  from public.trackstat_sessions where game_id = '10563114921';
$$;

revoke all on function public.trackstats_stealanegg_catalog_missing(text[]), public.trackstats_stealanegg_catalog_add(text,jsonb), public.trackstats_stealanegg_catalog_read(text[]), public.trackstats_stealanegg_public() from public;
grant execute on function public.trackstats_stealanegg_catalog_missing(text[]), public.trackstats_stealanegg_catalog_add(text,jsonb), public.trackstats_stealanegg_catalog_read(text[]), public.trackstats_stealanegg_public() to anon, authenticated;

notify pgrst, 'reload schema';
commit;
