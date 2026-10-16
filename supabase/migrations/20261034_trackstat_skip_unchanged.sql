begin;

-- A snapshot without the game's global exist counts (x), which change all the time without anything happening to the account.
create function public.trackstat_snapshot_core(p_snapshot jsonb)
returns jsonb language sql immutable set search_path='' as $$
  select case when jsonb_typeof(p_snapshot->'inventory')='array'
    then (p_snapshot - 'inventory') || jsonb_build_object('inventory', coalesce((select jsonb_agg(case when jsonb_typeof(e)='object' then e - 'x' else e end order by o) from jsonb_array_elements(p_snapshot->'inventory') with ordinality t(e,o)), '[]'::jsonb))
    else p_snapshot end;
$$;

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

-- The page fingerprint follows what is shown: whether each account is live right now (worked out at the moment of the check) and its newest save, not the heartbeat timestamps.
create or replace function public.trackstat_version(p_keys text[] default '{}')
returns text language plpgsql stable security definer set search_path='' as $$
declare v text;
begin
 if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
 with mine as (
   select a.id from public.trackstat_accounts a where a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
   union
   select ua.account_id from public.trackstat_user_accounts ua where ua.user_id=auth.uid()
 )
 select md5(coalesce(string_agg(m.id::text || ':' || public.trackstat_active_games(x.id, x.presence, x.presence_sessions)::text || ':' || coalesce((select max(s.updated_at)::text from public.trackstat_sessions s where s.account_id=m.id),''), '|' order by m.id), ''))
 into v
 from mine m join public.trackstat_accounts x on x.id=m.id;
 return v;
end $$;

notify pgrst, 'reload schema';
commit;
