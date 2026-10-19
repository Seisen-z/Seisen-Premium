-- Retention window 4 days -> 7 days: rewrites the live functions that use it, and the hourly cleanup job.
begin;

do $$
declare f record;
begin
  for f in
    select p.oid, pg_get_functiondef(p.oid) as def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and p.proname like 'trackstat%'
      and pg_get_functiondef(p.oid) like '%4 days%'
  loop
    execute replace(f.def, '4 days', '7 days');
  end loop;
end $$;

select cron.alter_job(
  (select jobid from cron.job where jobname = 'trackstat-retention'),
  command := $job$
  select public.trackstat_prune_history();
  delete from cron.job_run_details
  where jobid = (select jobid from cron.job where jobname = 'trackstat-retention')
    and end_time <= now() - interval '7 days';
$job$);

commit;
