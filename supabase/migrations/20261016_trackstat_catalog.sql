begin;

-- Shared item/pet catalog: static display data (icon, rarity, description) stored once and reused by every account.
create table public.trackstat_catalog (
  key text primary key check (length(key) between 1 and 120),
  class text not null check (length(class) between 1 and 30),
  name text not null check (length(name) between 1 and 100),
  icon text check (icon ~ '^[0-9]{1,20}$'),
  rarity text check (length(rarity) <= 30),
  rarity_num integer,
  rarity_color text check (rarity_color ~ '^#[0-9a-f]{6}$'),
  description text check (length(description) <= 300),
  created_at timestamptz not null default now()
);
alter table public.trackstat_catalog enable row level security;
revoke all on public.trackstat_catalog from public, anon, authenticated;

-- Which of these keys are not in the catalog yet (the library only uploads those).
create function public.trackstat_catalog_missing(p_keys text[])
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(k), '{}') from unnest(p_keys[1:2000]) k
  where not exists (select 1 from public.trackstat_catalog c where c.key = k);
$$;

-- First upload of a key wins; existing rows are never overwritten.
create function public.trackstat_catalog_add(p_key text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i jsonb; n integer := 0;
begin
  if not exists (select 1 from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')) then raise exception 'Invalid connection key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'Invalid items'; end if;
  for i in select * from jsonb_array_elements(p_items) loop
    insert into public.trackstat_catalog(key, class, name, icon, rarity, rarity_num, rarity_color, description)
    values (i->>'key', i->>'class', i->>'name', nullif(i->>'icon', ''), i->>'rarity', (i->>'rarity_num')::integer, i->>'rarity_color', i->>'description')
    on conflict (key) do nothing;
    n := n + 1;
  end loop;
  return jsonb_build_object('received', n);
end $$;

create function public.trackstat_catalog_read(p_keys text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.key, to_jsonb(c) - 'key' - 'created_at'), '{}'::jsonb)
  from public.trackstat_catalog c where c.key = any (p_keys[1:2000]);
$$;

revoke all on function public.trackstat_catalog_missing(text[]), public.trackstat_catalog_add(text,jsonb), public.trackstat_catalog_read(text[]) from public;
grant execute on function public.trackstat_catalog_missing(text[]), public.trackstat_catalog_add(text,jsonb), public.trackstat_catalog_read(text[]) to anon, authenticated;

-- Snapshots now carry an inventory array (up to 1000 stacks).
create or replace function public.trackstat_push(p_key text, p_session uuid, p_sequence bigint, p_game text, p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a uuid; metric text; side text; n numeric; old public.trackstat_sessions;
begin
  select id into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') for share;
  if a is null then raise exception 'Invalid connection key'; end if;
  if p_game <> '3317771874' or p_game is null or p_sequence is null or p_sequence < 1 then raise exception 'Invalid session'; end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' or octet_length(p_snapshot::text) > 200000 then raise exception 'Invalid snapshot'; end if;
  foreach side in array array['owned','gained'] loop
    foreach metric in array array['items','huge','titanic','gargantuan'] loop
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
    foreach metric in array array['items','huge','titanic','gargantuan'] loop
      if (p_snapshot #>> array['gained',metric])::numeric < (old.snapshot #>> array['gained',metric])::numeric then raise exception 'Session totals must increase'; end if;
    end loop;
  end if;
  insert into public.trackstat_sessions(id,account_id,game_id,sequence,snapshot)
    values(p_session,a,p_game,p_sequence,p_snapshot)
    on conflict(id) do update set sequence=excluded.sequence, snapshot=excluded.snapshot, updated_at=now();
  return jsonb_build_object('accepted', true, 'sequence', p_sequence);
end $$;

notify pgrst, 'reload schema';
commit;
