begin;

create extension if not exists pgcrypto with schema extensions;

create table public.trackstat_accounts (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  roblox_id text not null check (roblox_id ~ '^[0-9]{1,20}$'),
  username text not null check (length(username) between 1 and 50),
  created_at timestamptz not null default now()
);
create table public.trackstat_revoked_keys (
  key_hash text primary key,
  revoked_at timestamptz not null default now()
);
create table public.trackstat_sessions (
  id uuid primary key,
  account_id uuid not null references public.trackstat_accounts(id),
  game_id text not null check (game_id = '3317771874'),
  sequence bigint not null check (sequence > 0),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  snapshot jsonb not null
);
create index trackstat_sessions_account_time on public.trackstat_sessions(account_id, updated_at desc);
alter table public.trackstat_accounts enable row level security;
alter table public.trackstat_revoked_keys enable row level security;
alter table public.trackstat_sessions enable row level security;
revoke all on public.trackstat_accounts, public.trackstat_revoked_keys, public.trackstat_sessions from public, anon, authenticated;

create function public.trackstat_register(p_key text, p_roblox_id text, p_username text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare h text; a public.trackstat_accounts;
begin
  if p_key is null or p_key !~ '^sp_[a-f0-9]{64}$' then raise exception 'Invalid connection key'; end if;
  h := encode(extensions.digest(p_key, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(h, 0));
  if exists(select 1 from public.trackstat_revoked_keys where key_hash = h) then raise exception 'Connection key was reset'; end if;
  insert into public.trackstat_accounts(key_hash, roblox_id, username) values(h, p_roblox_id, p_username)
    on conflict (key_hash) do nothing;
  select * into strict a from public.trackstat_accounts where key_hash = h;
  if a.roblox_id <> p_roblox_id then raise exception 'Account mismatch'; end if;
  return jsonb_build_object('username', a.username, 'roblox_id', a.roblox_id);
end $$;

create function public.trackstat_reset(p_key text, p_new_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare h text; nh text; a uuid;
begin
  if p_new_key is null or p_new_key !~ '^sp_[a-f0-9]{64}$' or p_new_key = p_key then raise exception 'Invalid new key'; end if;
  h := encode(extensions.digest(p_key, 'sha256'), 'hex');
  nh := encode(extensions.digest(p_new_key, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(h, 0));
  perform pg_advisory_xact_lock(hashtextextended(nh, 0));
  if exists(select 1 from public.trackstat_revoked_keys where key_hash = nh) then raise exception 'Invalid new key'; end if;
  select id into a from public.trackstat_accounts where key_hash = h for update;
  if a is null then raise exception 'Invalid connection key'; end if;
  insert into public.trackstat_revoked_keys(key_hash) values(h);
  update public.trackstat_accounts set key_hash = nh where id = a;
  return jsonb_build_object('reset', true);
end $$;

create function public.trackstat_push(p_key text, p_session uuid, p_sequence bigint, p_game text, p_snapshot jsonb)
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

create function public.trackstat_private(p_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.trackstat_accounts; sessions jsonb;
begin
  select * into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if a.id is null then raise exception 'Invalid connection key'; end if;
  select coalesce(jsonb_agg(to_jsonb(s) - 'account_id' order by s.updated_at desc), '[]'::jsonb) into sessions
    from (select * from public.trackstat_sessions where account_id=a.id order by updated_at desc limit 50) s;
  return jsonb_build_object('account', jsonb_build_object('username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions);
end $$;

create function public.trackstat_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('game','Pet Simulator 99', 'accounts', count(distinct account_id), 'sessions',count(*),
    'live', count(distinct account_id) filter(where updated_at > now()-interval '90 seconds'),
    'gained', jsonb_build_object(
      'items',coalesce(sum((snapshot #>> '{gained,items}')::numeric),0),
      'huge',coalesce(sum((snapshot #>> '{gained,huge}')::numeric),0),
      'titanic',coalesce(sum((snapshot #>> '{gained,titanic}')::numeric),0),
      'gargantuan',coalesce(sum((snapshot #>> '{gained,gargantuan}')::numeric),0)))
  from public.trackstat_sessions;
$$;

revoke all on function public.trackstat_register(text,text,text), public.trackstat_reset(text,text), public.trackstat_push(text,uuid,bigint,text,jsonb), public.trackstat_private(text), public.trackstat_public() from public;
grant execute on function public.trackstat_register(text,text,text), public.trackstat_reset(text,text), public.trackstat_push(text,uuid,bigint,text,jsonb), public.trackstat_private(text), public.trackstat_public() to anon, authenticated;

drop table public.cloud_rate;
drop table public.cloud_test_game;
notify pgrst, 'reload schema';
commit;
