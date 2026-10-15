begin;
alter table public.trackstat_accounts add column push_at jsonb not null default '{}'::jsonb;
create table public.trackstat_pruned_sessions (
 id uuid primary key,
 account_id uuid not null references public.trackstat_accounts(id) on delete cascade,
 pruned_at timestamptz not null default now()
);
alter table public.trackstat_pruned_sessions enable row level security;
revoke all on public.trackstat_pruned_sessions from public,anon,authenticated;

create function public.trackstat_trim_sessions(p_account uuid,p_game text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 perform 1 from public.trackstat_accounts where id=p_account for update;
 with excess as (
  select id from public.trackstat_sessions where account_id=p_account and game_id=p_game order by updated_at desc,id desc offset 3
 ), removed as (
  delete from public.trackstat_sessions s using excess e where s.id=e.id returning s.id,s.account_id
 ) insert into public.trackstat_pruned_sessions(id,account_id) select id,account_id from removed on conflict(id) do nothing;
end $$;
revoke all on function public.trackstat_trim_sessions(uuid,text) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.trackstat_push(p_key text, p_session uuid, p_sequence bigint, p_game text, p_snapshot jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a uuid; metric text; side text; n numeric; old public.trackstat_sessions; metrics text[]; last_push timestamptz;
begin
  select id into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') for update;
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
  if exists(select 1 from public.trackstat_pruned_sessions where id=p_session) then
    return jsonb_build_object('accepted',false,'expired',true);
  end if;
  select (push_at->>p_game)::timestamptz into last_push from public.trackstat_accounts where id=a;
  if last_push > clock_timestamp()-interval '15 seconds' then
    return jsonb_build_object('accepted',false,'rateLimited',true,'retryAfter',greatest(1,ceil(extract(epoch from last_push+interval '15 seconds'-clock_timestamp()))));
  end if;
  insert into public.trackstat_sessions(id,account_id,game_id,sequence,snapshot)
    values(p_session,a,p_game,p_sequence,p_snapshot)
    on conflict(id) do update set sequence=excluded.sequence, snapshot=excluded.snapshot, updated_at=now();
  update public.trackstat_accounts set push_at=jsonb_set(push_at,array[p_game],to_jsonb(clock_timestamp())) where id=a;
  perform public.trackstat_trim_sessions(a,p_game);
  return jsonb_build_object('accepted', true, 'sequence', p_sequence);
end $function$
;
CREATE OR REPLACE FUNCTION public.trackstat_prune_history()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cutoff timestamptz := now() - interval '8 days'; pair record;
begin
  with removed as (
  delete from public.trackstat_sessions s
  where s.updated_at <= cutoff and exists (
    select 1 from public.trackstat_sessions newer
    where newer.account_id = s.account_id and newer.game_id = s.game_id
      and (newer.updated_at, newer.id) > (s.updated_at, s.id)
  ) returning s.id,s.account_id
  ) insert into public.trackstat_pruned_sessions(id,account_id) select id,account_id from removed on conflict(id) do nothing;
  update public.trackstat_sessions s
  set snapshot = s.snapshot || jsonb_build_object(
    'gained', (select jsonb_object_agg(k, 0) from jsonb_object_keys(s.snapshot->'gained') k),
    'details', '[]'::jsonb)
  where s.updated_at <= cutoff and (
    s.snapshot->'details' <> '[]'::jsonb or exists (
      select 1 from jsonb_each_text(s.snapshot->'gained') g where g.value::numeric <> 0
    )
  );
  delete from public.trackstat_daily_gains where day < (now() at time zone 'UTC')::date-7;
  for pair in select distinct account_id,game_id from public.trackstat_sessions loop
    perform public.trackstat_trim_sessions(pair.account_id,pair.game_id);
  end loop;
  delete from public.trackstat_pruned_sessions where pruned_at <= cutoff;
end $function$
;
create function public.trackstat_image_manifest(p_game text,p_icons text[])
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
 if p_game is null or p_game not in ('petsimulator99','stealanegg') then raise exception 'Unsupported game';end if;
 select coalesce(jsonb_agg(icon),'[]'::jsonb) into result from (
  select distinct icon from unnest(p_icons[1:2000]) icon
  where icon ~ '^[0-9]{1,20}$' and exists(
   select 1 from storage.objects o where o.bucket_id='trackstats-images' and o.name=p_game||'/'||icon||'.png'
  )
 ) found;
 return result;
end $$;
revoke all on function public.trackstat_image_manifest(text,text[]) from public;
grant execute on function public.trackstat_image_manifest(text,text[]) to anon,authenticated;
create temp table trackstat_initial_prune as
 select * from public.trackstat_sessions where id in(
  select id from(select id,row_number() over(partition by account_id,game_id order by updated_at desc,id desc) rn from public.trackstat_sessions)s where rn>3
 );
do $$declare pair record;begin
 for pair in select distinct account_id,game_id from public.trackstat_sessions loop perform public.trackstat_trim_sessions(pair.account_id,pair.game_id);end loop;
end $$;
drop table trackstat_initial_prune;
notify pgrst, 'reload schema';
commit;
