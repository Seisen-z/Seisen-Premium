begin;
lock table public.trackstat_sessions in share row exclusive mode;
alter table public.trackstat_sessions add column daily_checkpoint jsonb;
update public.trackstat_sessions set daily_checkpoint=snapshot->'gained';
create table public.trackstat_daily_gains (
  account_id uuid not null references public.trackstat_accounts(id) on delete cascade,
  game_id text not null check(game_id in ('3317771874','10563114921')),
  day date not null,
  gained jsonb not null,
  primary key(account_id,game_id,day)
);
alter table public.trackstat_daily_gains enable row level security;
revoke all on public.trackstat_daily_gains from public,anon,authenticated;

-- Only single-day legacy sessions can be assigned to a date without guessing.
insert into public.trackstat_daily_gains(account_id,game_id,day,gained)
select account_id,game_id,day,jsonb_object_agg(metric,gain) from (
  select s.account_id,s.game_id,(s.updated_at at time zone 'UTC')::date as day,g.key as metric,sum(g.value::text::numeric) as gain
  from public.trackstat_sessions s cross join lateral jsonb_each(s.snapshot->'gained') g
  where (s.updated_at at time zone 'UTC')::date >= (now() at time zone 'UTC')::date-7
    and (s.started_at at time zone 'UTC')::date=(s.updated_at at time zone 'UTC')::date
    and g.key=any(case s.game_id when '3317771874' then array['items','huge','titanic','gargantuan'] else array['pets','eggs','gear','items'] end)
  group by s.account_id,s.game_id,(s.updated_at at time zone 'UTC')::date,g.key
) metrics group by account_id,game_id,day;

create function public.trackstat_record_daily_gains()
returns trigger language plpgsql security definer set search_path = '' as $$
declare metric text; delta jsonb := '{}'::jsonb; checkpoint jsonb := '{}'::jsonb; baseline numeric; increment numeric; changed boolean := false;
begin
  foreach metric in array case new.game_id when '3317771874' then array['items','huge','titanic','gargantuan'] else array['pets','eggs','gear','items'] end loop
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
revoke all on function public.trackstat_record_daily_gains() from public,anon,authenticated;
create trigger trackstat_daily_gains after insert or update of snapshot on public.trackstat_sessions
for each row execute function public.trackstat_record_daily_gains();

CREATE OR REPLACE FUNCTION public.trackstat_private(p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a public.trackstat_accounts; sessions jsonb; active_games jsonb; daily jsonb;
begin
  select * into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if a.id is null then raise exception 'Invalid connection key'; end if;
  select coalesce(jsonb_agg(to_jsonb(s) - 'account_id' - 'daily_checkpoint' || jsonb_build_object('history_expired', s.updated_at <= now()-interval '8 days') order by s.updated_at desc), '[]'::jsonb) into sessions
    from (
      (select * from public.trackstat_sessions where account_id=a.id and updated_at > now()-interval '8 days' order by updated_at desc limit 50)
      union
      (select distinct on (game_id) * from public.trackstat_sessions where account_id=a.id order by game_id, updated_at desc, id desc)
    ) s;
  active_games := public.trackstat_active_games(a.id, a.presence, a.presence_sessions);
  select coalesce(jsonb_agg(jsonb_build_object('day',day,'game_id',game_id,'gained',gained) order by day,game_id),'[]'::jsonb) into daily from public.trackstat_daily_gains where account_id=a.id and day >= (now() at time zone 'UTC')::date-7;
  return jsonb_build_object('account', jsonb_build_object('username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions, 'activeGames',active_games,'daily',daily);
end $function$
;
CREATE OR REPLACE FUNCTION public.trackstat_prune_history()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cutoff timestamptz := now() - interval '8 days';
begin
  delete from public.trackstat_sessions s
  where s.updated_at <= cutoff and exists (
    select 1 from public.trackstat_sessions newer
    where newer.account_id = s.account_id and newer.game_id = s.game_id
      and (newer.updated_at, newer.id) > (s.updated_at, s.id)
  );
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
end $function$
;
notify pgrst, 'reload schema';
commit;
