begin;

-- Anime Dice shares the existing key, retention, rate limit and presence lifecycle.

alter table public.trackstat_sessions drop constraint trackstat_sessions_game_id_check;

alter table public.trackstat_sessions add constraint trackstat_sessions_game_id_check check(game_id in ('3317771874','10563114921','10708913337'));

alter table public.trackstat_daily_gains drop constraint trackstat_daily_gains_game_id_check;

alter table public.trackstat_daily_gains add constraint trackstat_daily_gains_game_id_check check(game_id in ('3317771874','10563114921','10708913337'));

alter table public.trackstat_samples drop constraint trackstat_samples_game_id_check;

alter table public.trackstat_samples add constraint trackstat_samples_game_id_check check(game_id in ('3317771874','10563114921','10708913337'));

create or replace function public.trackstat_push(p_key text, p_session uuid, p_sequence bigint, p_game text, p_snapshot jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a uuid; metric text; side text; n numeric; old public.trackstat_sessions; metrics text[]; last_push timestamptz;
begin
  select id into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') for update;
  if a is null then raise exception 'Invalid connection key'; end if;
  if p_game is null or p_game not in ('3317771874', '10563114921', '10708913337') or p_sequence is null or p_sequence < 1 then raise exception 'Invalid session'; end if;
  metrics := case p_game when '3317771874' then array['items','huge','titanic','gargantuan'] when '10708913337' then array['units','boosts','gear','items'] else array['pets','eggs','gear','items'] end;
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
  if exists(select 1 from public.trackstat_pruned_sessions where id=p_session) then
    return jsonb_build_object('accepted',false,'expired',true);
  end if;
  select (push_at->>p_game)::timestamptz into last_push from public.trackstat_accounts where id=a;
  if last_push > clock_timestamp()-interval '15 seconds' then
    return jsonb_build_object('accepted',false,'rateLimited',true,'retryAfter',greatest(1,ceil(extract(epoch from last_push+interval '15 seconds'-clock_timestamp()))));
  end if;
  -- Only the game's global exist counts changed: keep the saved copy and its timestamp (refreshed at most every 10 minutes) so an account with nothing new costs nothing
  if old.id is not null and old.updated_at > now()-interval '10 minutes' and public.trackstat_snapshot_core(old.snapshot) = public.trackstat_snapshot_core(p_snapshot) then
    begin
      perform public.trackstat_record_sample(a,p_game,p_snapshot);
    exception when others then null;
    end;
    return jsonb_build_object('accepted', true, 'sequence', p_sequence, 'unchanged', true);
  end if;
  insert into public.trackstat_sessions(id,account_id,game_id,sequence,snapshot)
    values(p_session,a,p_game,p_sequence,p_snapshot)
    on conflict(id) do update set sequence=excluded.sequence, snapshot=excluded.snapshot, updated_at=now();
  update public.trackstat_accounts set push_at=jsonb_set(push_at,array[p_game],to_jsonb(clock_timestamp())) where id=a;
  perform public.trackstat_trim_sessions(a,p_game);
  begin
    perform public.trackstat_record_sample(a,p_game,p_snapshot);
  exception when others then null;
  end;
  return jsonb_build_object('accepted', true, 'sequence', p_sequence);
end $function$;

create or replace function public.trackstat_presence(p_key text, p_session uuid, p_game text, p_active boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.trackstat_accounts; records jsonb; current_record jsonb;
begin
  if p_game is null or p_game not in ('3317771874','10563114921','10708913337') or p_session is null or p_active is null then raise exception 'Invalid presence'; end if;
  select * into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key,'sha256'),'hex') for update;
  if a.id is null then raise exception 'Invalid connection key'; end if;
  current_record := a.presence_sessions -> p_session::text;
  if current_record is not null and current_record->>'game' <> p_game then raise exception 'Session mismatch'; end if;
  if current_record->>'active' = 'false' then return jsonb_build_object('active',false); end if;
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into records from jsonb_each(a.presence_sessions)
    where (value->>'seen_at')::timestamptz > now()-interval '8 days';
  records := jsonb_set(records,array[p_session::text],jsonb_build_object('game',p_game,'active',p_active,'seen_at',now()));
  update public.trackstat_accounts set presence_sessions=records where id=a.id;
  return jsonb_build_object('active',p_active);
end $$;

create or replace function public.trackstat_inventory(p_keys text[], p_roblox text, p_game text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r record;
begin
 if p_roblox is null or p_roblox !~ '^[0-9]{1,20}$' or p_game not in ('3317771874','10563114921','10708913337') then raise exception 'Invalid request'; end if;
 if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
 select s.id, s.updated_at, s.snapshot->'inventory' as inventory into r
 from public.trackstat_sessions s join public.trackstat_accounts a on a.id=s.account_id
 where a.roblox_id=p_roblox and s.game_id=p_game
   and (a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
     or (auth.uid() is not null and exists(select 1 from public.trackstat_user_accounts u where u.user_id=auth.uid() and u.account_id=a.id)))
 order by s.updated_at desc, s.id desc limit 1;
 if r.id is null then return jsonb_build_object('inventory', null); end if;
 return jsonb_build_object('id', r.id, 'updated_at', r.updated_at, 'inventory', r.inventory);
end $$;

create or replace function public.trackstat_shared_inventory(p_token text, p_game text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a uuid; r record;
begin
 if p_token is null or p_token !~ '^[A-Za-z0-9_-]{20,64}$' or p_game is null or p_game not in ('3317771874','10563114921','10708913337') then raise exception 'Invalid link'; end if;
 select s.account_id into a from public.trackstat_shares s where s.token=p_token;
 if a is null then raise exception 'Invalid link'; end if;
 select s.id, s.updated_at, s.snapshot->'inventory' as inventory into r
 from public.trackstat_sessions s where s.account_id=a and s.game_id=p_game order by s.updated_at desc, s.id desc limit 1;
 if r.id is null then return jsonb_build_object('inventory', null); end if;
 return jsonb_build_object('updated_at', r.updated_at, 'inventory', r.inventory);
end $$;

create or replace function public.trackstat_record_daily_gains()
returns trigger language plpgsql security definer set search_path = '' as $$
declare metric text; delta jsonb := '{}'::jsonb; checkpoint jsonb := '{}'::jsonb; baseline numeric; increment numeric; changed boolean := false;
begin
  foreach metric in array case new.game_id when '3317771874' then array['items','huge','titanic','gargantuan'] when '10708913337' then array['units','boosts','gear','items'] else array['pets','eggs','gear','items'] end loop
    baseline := case when tg_op='UPDATE' then coalesce((old.daily_checkpoint->>metric)::numeric,(old.snapshot #>> array['gained',metric])::numeric,0) else 0 end;
    increment := greatest((new.snapshot #>> array['gained',metric])::numeric-baseline,0);
    checkpoint := jsonb_set(checkpoint,array[metric],to_jsonb(baseline+increment));
    delta := jsonb_set(delta,array[metric],to_jsonb(increment));
    changed := changed or increment > 0;
  end loop;
  if new.daily_checkpoint is distinct from checkpoint then
    update public.trackstat_sessions set daily_checkpoint=checkpoint where id=new.id;
  end if;
  if not changed then return new; end if;
  insert into public.trackstat_daily_gains as d(account_id,game_id,day,gained)
    values(new.account_id,new.game_id,(new.updated_at at time zone 'UTC')::date,delta)
    on conflict(account_id,game_id,day) do update set gained=(
      select jsonb_object_agg(k,coalesce((d.gained->>k)::numeric,0)+(excluded.gained->>k)::numeric)
      from jsonb_object_keys(excluded.gained) k
    );
  return new;
end $$;

create or replace function public.trackstat_image_manifest(p_game text,p_icons text[])
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
 if p_game is null or p_game not in ('petsimulator99','stealanegg','animedice') then raise exception 'Unsupported game';end if;
 select coalesce(jsonb_agg(icon),'[]'::jsonb) into result from (
  select distinct icon from unnest(p_icons[1:2000]) icon
  where icon ~ '^[0-9]{1,20}$' and exists(
   select 1 from storage.objects o where o.bucket_id='trackstats-images' and o.name=p_game||'/'||icon||'.png'
  )
 ) found;
 return result;
end $$;

create table public.trackstats_animedice (
  key text primary key check (length(key) between 1 and 120),
  kind text not null check (kind in ('unit','boost','gear','token','spin','gamepass','item')),
  name text not null check (length(name) between 1 and 100),
  icon text check (icon ~ '^[0-9]{1,20}$'),
  rarity text check (length(rarity) <= 30),
  rarity_num integer,
  rarity_color text check (rarity_color ~ '^#[0-9a-f]{6}$'),
  description text check (length(description) <= 300),
  created_at timestamptz not null default now()
);
alter table public.trackstats_animedice enable row level security;
revoke all on public.trackstats_animedice from public, anon, authenticated;

create function public.trackstats_animedice_catalog_missing(p_keys text[])
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(k), '{}') from unnest(p_keys[1:2000]) k
  where not exists (select 1 from public.trackstats_animedice c where c.key = k);
$$;

create function public.trackstats_animedice_catalog_add(p_key text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i jsonb; n integer := 0;
begin
  if not exists (select 1 from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')) then raise exception 'Invalid connection key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'Invalid items'; end if;
  for i in select * from jsonb_array_elements(p_items) loop
    insert into public.trackstats_animedice(key, kind, name, icon, rarity, rarity_num, rarity_color, description)
    values (i->>'key', i->>'kind', i->>'name', nullif(i->>'icon', ''), i->>'rarity', (i->>'rarity_num')::integer, i->>'rarity_color', i->>'description')
    on conflict (key) do nothing;
    n := n + 1;
  end loop;
  return jsonb_build_object('received', n);
end $$;

create function public.trackstats_animedice_catalog_read(p_keys text[],p_names text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.key,to_jsonb(c)-'key'-'created_at'),'{}'::jsonb)
  from public.trackstats_animedice c
  where c.key=any(p_keys[1:2000]) or lower(c.name)=any(p_names[1:2000]);
$$;


create function public.trackstats_animedice_public()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('game','Anime Dice','accounts',count(distinct account_id),'sessions',count(*),
  'live',(select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '10708913337'),
  'gained',jsonb_build_object('units',coalesce(sum((snapshot#>>'{gained,units}')::numeric),0),'boosts',coalesce(sum((snapshot#>>'{gained,boosts}')::numeric),0),'gear',coalesce(sum((snapshot#>>'{gained,gear}')::numeric),0),'items',coalesce(sum((snapshot#>>'{gained,items}')::numeric),0)))
 from public.trackstat_sessions where game_id='10708913337' and updated_at>now()-interval '8 days';
$$;
revoke all on function public.trackstats_animedice_catalog_missing(text[]),public.trackstats_animedice_catalog_add(text,jsonb),public.trackstats_animedice_catalog_read(text[],text[]),public.trackstats_animedice_public() from public;
grant execute on function public.trackstats_animedice_catalog_missing(text[]),public.trackstats_animedice_catalog_add(text,jsonb),public.trackstats_animedice_catalog_read(text[],text[]),public.trackstats_animedice_public() to anon,authenticated;
drop policy "trackstats images insert new png" on storage.objects;
create policy "trackstats images insert new png" on storage.objects for insert to anon,authenticated
with check(bucket_id='trackstats-images' and name ~ '^(stealanegg|petsimulator99|animedice)/[0-9]{1,20}\.png$');
notify pgrst,'reload schema';
commit;
