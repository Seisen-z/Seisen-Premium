begin;
lock table public.trackstat_sessions in share row exclusive mode;

create table public.trackstat_daily_activity (
 account_id uuid not null references public.trackstat_accounts(id) on delete cascade,
 game_id text not null,
 day date not null,
 kind text not null,
 name text not null,
 gained numeric not null,
 owned numeric not null,
 at timestamptz not null,
 primary key(account_id,game_id,day,kind,name)
);
create index trackstat_daily_activity_day on public.trackstat_daily_activity(day);
alter table public.trackstat_daily_activity enable row level security;
revoke all on public.trackstat_daily_activity from public,anon,authenticated;
alter table public.trackstat_sessions add column activity_checkpoint jsonb not null default '{}';

-- Seed counters without attributing a multi-day session's lifetime gains to its final day.
update public.trackstat_sessions s set activity_checkpoint=coalesce((
 select jsonb_object_agg(jsonb_build_array(d->>'kind',d->>'name')::text,to_jsonb((d->>'gained')::numeric))
 from jsonb_array_elements(s.snapshot->'details') d
),'{}'::jsonb);
insert into public.trackstat_daily_activity(account_id,game_id,day,kind,name,gained,owned,at)
select s.account_id,s.game_id,(s.updated_at at time zone 'UTC')::date,d->>'kind',d->>'name',sum((d->>'gained')::numeric),max((d->>'owned')::numeric),max(s.updated_at)
from public.trackstat_sessions s cross join lateral jsonb_array_elements(s.snapshot->'details') d
where (s.started_at at time zone 'UTC')::date=(s.updated_at at time zone 'UTC')::date
 and (s.updated_at at time zone 'UTC')::date >= (now() at time zone 'UTC')::date-6
 and (d->>'gained')::numeric>0
group by s.account_id,s.game_id,(s.updated_at at time zone 'UTC')::date,d->>'kind',d->>'name';

create function public.trackstat_record_daily_activity()
returns trigger language plpgsql security definer set search_path='' as $$
declare d jsonb; k text; prior numeric; increment numeric;
begin
 new.activity_checkpoint := case when tg_op='UPDATE' then old.activity_checkpoint else '{}'::jsonb end;
 for d in select * from jsonb_array_elements(new.snapshot->'details') loop
  k := jsonb_build_array(d->>'kind',d->>'name')::text;
  prior := coalesce((new.activity_checkpoint->>k)::numeric,0);
  increment := greatest(coalesce((d->>'gained')::numeric,0)-prior,0);
  new.activity_checkpoint := jsonb_set(new.activity_checkpoint,array[k],to_jsonb(prior+increment));
  if increment>0 then
   insert into public.trackstat_daily_activity as a(account_id,game_id,day,kind,name,gained,owned,at)
   values(new.account_id,new.game_id,(new.updated_at at time zone 'UTC')::date,d->>'kind',d->>'name',increment,coalesce((d->>'owned')::numeric,0),new.updated_at)
   on conflict(account_id,game_id,day,kind,name) do update
    set gained=a.gained+excluded.gained,owned=excluded.owned,at=excluded.at;
  end if;
 end loop;
 return new;
end $$;
revoke all on function public.trackstat_record_daily_activity() from public,anon,authenticated;
create trigger trackstat_daily_activity before insert or update of snapshot on public.trackstat_sessions
for each row execute function public.trackstat_record_daily_activity();

-- Preserve the installed read's authentication, live-status and slim-inventory behavior.
do $$
declare def text;
 old_fields constant text := $x$jsonb_build_object('day',day,'game_id',game_id,'gained',gained)$x$;
 new_fields constant text := $x$jsonb_build_object('day',day,'game_id',game_id,'gained',gained,'details',coalesce((select jsonb_agg(jsonb_build_object('kind',activity.kind,'name',activity.name,'gained',activity.gained,'owned',activity.owned,'t',extract(epoch from activity.at)::bigint) order by activity.at desc) from public.trackstat_daily_activity activity where activity.account_id=p_account and activity.game_id=trackstat_daily_gains.game_id and activity.day=trackstat_daily_gains.day),'[]'::jsonb))$x$;
begin
 def := pg_get_functiondef('public.trackstat_private_data(uuid,boolean)'::regprocedure);
 if strpos(def,old_fields)=0 then raise exception 'Daily read anchor missing';end if;
 def := replace(def,old_fields,new_fields);
 def := replace(def,'''8 days''','''7 days''');
 def := replace(def,'::date-7','::date-6');
 def := replace(def,'''daily_checkpoint''','''daily_checkpoint'' - ''activity_checkpoint''');
 execute def;
end $$;

create or replace function public.trackstat_prune_history()
returns void language plpgsql security definer set search_path='' as $$
declare cutoff timestamptz:=now()-interval '7 days';
begin
 with removed as (
  delete from public.trackstat_sessions s where s.updated_at<cutoff and exists(
   select 1 from public.trackstat_sessions n where n.account_id=s.account_id and n.game_id=s.game_id and (n.updated_at,n.id)>(s.updated_at,s.id)
  ) returning s.id,s.account_id
 ) insert into public.trackstat_pruned_sessions(id,account_id) select id,account_id from removed on conflict(id) do nothing;
 -- Keep only the latest state carrier and replay counters; never discard its inventory.
 update public.trackstat_sessions s set snapshot=s.snapshot||jsonb_build_object('details','[]'::jsonb,'gained',(select jsonb_object_agg(k,0) from jsonb_object_keys(s.snapshot->'gained') k))
 where s.updated_at<cutoff and (s.snapshot->'details'<>'[]'::jsonb or exists(select 1 from jsonb_each_text(s.snapshot->'gained') g where g.value::numeric<>0));
 delete from public.trackstat_daily_activity where day<(now() at time zone 'UTC')::date-6;
 delete from public.trackstat_daily_gains where day<(now() at time zone 'UTC')::date-6;
 delete from public.trackstat_samples where at<cutoff;
 delete from public.trackstat_community where updated_at<cutoff;
 delete from public.trackstat_pruned_sessions where pruned_at<cutoff;
end $$;
revoke all on function public.trackstat_prune_history() from public,anon,authenticated;

-- Count daily account records rather than presenting session counts as days.
do $$
declare f text; def text;
begin
 foreach f in array array['trackstat_public','trackstats_stealanegg_public','trackstats_animedice_public'] loop
  def:=pg_get_functiondef(to_regprocedure('public.'||f||'()'));
  if def is not null then
   execute replace(def,'''sessions'', count(*)','''sessions'', count(distinct (account_id,(updated_at at time zone ''UTC'')::date))');
  end if;
 end loop;
end $$;

-- A quiet account's current inventory must not disappear through account GC.
select cron.unschedule(jobid) from cron.job where jobname='trackstat-accounts-gc';
select cron.alter_job((select jobid from cron.job where jobname='trackstat-retention'),command:=$job$
 select public.trackstat_prune_history();
 delete from cron.job_run_details where jobid=(select jobid from cron.job where jobname='trackstat-retention') and end_time<now()-interval '7 days';
$job$);
select public.trackstat_prune_history();
notify pgrst,'reload schema';
commit;
