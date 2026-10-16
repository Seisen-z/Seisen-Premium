begin;

-- Shared fixed-window rate limits (website sign-in codes, new-connection throttle).
create table public.trackstat_rate_limits (
 bucket text primary key,
 window_end timestamptz not null,
 hits integer not null
);
alter table public.trackstat_rate_limits enable row level security;
revoke all on public.trackstat_rate_limits from public,anon,authenticated;
create function public.trackstat_rate_limit(p_bucket text,p_limit integer,p_window_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.trackstat_rate_limits;
begin
 insert into public.trackstat_rate_limits(bucket,window_end,hits) values(p_bucket,now()+make_interval(secs=>p_window_seconds),1)
 on conflict(bucket) do update set
  hits=case when public.trackstat_rate_limits.window_end<=now() then 1 else public.trackstat_rate_limits.hits+1 end,
  window_end=case when public.trackstat_rate_limits.window_end<=now() then now()+make_interval(secs=>p_window_seconds) else public.trackstat_rate_limits.window_end end
 returning * into r;
 if random()<0.02 then delete from public.trackstat_rate_limits where window_end<now()-interval '1 day'; end if;
 return jsonb_build_object('allowed',r.hits<=p_limit,'retryAfter',greatest(1,ceil(extract(epoch from r.window_end-now()))));
end $$;
revoke all on function public.trackstat_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.trackstat_rate_limit(text,integer,integer) to service_role;

-- A small time series (one row per account and game every 15 minutes, kept 8 days) for dashboard trends.
create table public.trackstat_samples (
 account_id uuid not null references public.trackstat_accounts(id) on delete cascade,
 game_id text not null check(game_id in ('3317771874','10563114921')),
 at timestamptz not null default now(),
 money numeric,
 per_second numeric,
 inventory_value numeric,
 primary key(account_id,game_id,at)
);
alter table public.trackstat_samples enable row level security;
revoke all on public.trackstat_samples from public,anon,authenticated;
create function public.trackstat_record_sample(p_account uuid,p_game text,p_snapshot jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare m numeric; ps numeric; v numeric;
begin
 if exists(select 1 from public.trackstat_samples where account_id=p_account and game_id=p_game and at>now()-interval '15 minutes') then return; end if;
 m:=(p_snapshot->>'money')::numeric; ps:=(p_snapshot->>'per_second')::numeric;
 if jsonb_typeof(p_snapshot->'inventory')='array' then
  select sum(coalesce((e->>'r')::numeric,0)*coalesce((e->>'a')::numeric,0)) into v from jsonb_array_elements(p_snapshot->'inventory') e;
 end if;
 insert into public.trackstat_samples(account_id,game_id,money,per_second,inventory_value) values(p_account,p_game,m,ps,v);
 delete from public.trackstat_samples where account_id=p_account and at<now()-interval '8 days';
end $$;
revoke all on function public.trackstat_record_sample(uuid,text,jsonb) from public,anon,authenticated;

-- Rows are [time ms, game, money, money per second, inventory value]
create function public.trackstat_samples_data(p_account uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('account',p_account,'rows',coalesce(jsonb_agg(jsonb_build_array((extract(epoch from at)*1000)::bigint,game_id,money,per_second,inventory_value) order by at),'[]'::jsonb))
 from public.trackstat_samples where account_id=p_account and at>now()-interval '8 days';
$$;
revoke all on function public.trackstat_samples_data(uuid) from public,anon,authenticated;
create function public.trackstat_samples(p_key text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a uuid;
begin
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex');
 if a is null then raise exception 'Invalid connection key'; end if;
 return public.trackstat_samples_data(a);
end $$;
create function public.trackstat_user_samples()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return (select coalesce(jsonb_agg(public.trackstat_samples_data(account_id)),'[]'::jsonb) from public.trackstat_user_accounts where user_id=auth.uid());
end $$;
revoke all on function public.trackstat_samples(text),public.trackstat_user_samples() from public,anon;
grant execute on function public.trackstat_samples(text) to anon,authenticated;
grant execute on function public.trackstat_user_samples() to authenticated;

-- Same as 20261027, plus a best-effort sample that can never fail a sync.
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
  begin
    perform public.trackstat_record_sample(a,p_game,p_snapshot);
  exception when others then null;
  end;
  return jsonb_build_object('accepted', true, 'sequence', p_sequence);
end $function$
;

-- Same as 20261015, plus a limit of 20 brand-new connections per hour per caller IP.
create or replace function public.trackstat_register(p_key text, p_roblox_id text, p_username text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare h text; a public.trackstat_accounts; ip text;
begin
  if p_key is null or p_key !~ '^sp_[a-f0-9]{64}$' then raise exception 'Invalid connection key'; end if;
  h := encode(extensions.digest(p_key, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(h, 0));
  if exists(select 1 from public.trackstat_revoked_keys where key_hash = h) then raise exception 'Connection key was reset'; end if;
  if not exists(select 1 from public.trackstat_accounts where key_hash = h) then
    ip := split_part(coalesce(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', ''), ',', 1);
    if ip <> '' and not (public.trackstat_rate_limit('register:' || md5(ip), 20, 3600)->>'allowed')::boolean then raise exception 'Too many new connections. Try again later.'; end if;
  end if;
  insert into public.trackstat_accounts(key_hash, roblox_id, username) values(h, p_roblox_id, p_username)
    on conflict (key_hash) do nothing;
  select * into strict a from public.trackstat_accounts where key_hash = h;
  if a.roblox_id <> p_roblox_id then raise exception 'Account mismatch'; end if;
  return jsonb_build_object('username', a.username, 'roblox_id', a.roblox_id);
end $$;

-- Accounts nobody linked to an email and that have not synced for 90 days are removed (a returning library simply registers again).
create function public.trackstat_prune_accounts()
returns void language plpgsql security definer set search_path='' as $$
declare stale uuid[];
begin
 select coalesce(array_agg(a.id),'{}') into stale from public.trackstat_accounts a
 where not exists(select 1 from public.trackstat_user_accounts u where u.account_id=a.id)
 and coalesce((select max(s.updated_at) from public.trackstat_sessions s where s.account_id=a.id),a.created_at)<now()-interval '90 days';
 delete from public.trackstat_sessions where account_id=any(stale);
 delete from public.trackstat_accounts where id=any(stale);
end $$;
revoke all on function public.trackstat_prune_accounts() from public,anon,authenticated;
select cron.schedule('trackstat-accounts-gc','30 3 * * *','select public.trackstat_prune_accounts()');

notify pgrst, 'reload schema';
commit;
