-- Inventories now live on the Trackstat server (trackstat-server/). Supabase keeps only the totals it needs from them:
-- inventory_value and has_inventory. Every incoming sync is stripped here, so older library versions are covered too.
begin;

alter table public.trackstat_sessions disable trigger trackstat_daily_gains;

create or replace function public.trackstat_inventory_value(p_snapshot jsonb)
returns numeric language plpgsql immutable set search_path = '' as $$
begin
 if jsonb_typeof(p_snapshot->'inventory')='array' then
  return (select coalesce(sum(coalesce((e->>'r')::numeric,0)*coalesce((e->>'a')::numeric,0)),0) from jsonb_array_elements(p_snapshot->'inventory') e);
 end if;
 if jsonb_typeof(p_snapshot->'inventory_value')='number' then return (p_snapshot->>'inventory_value')::numeric; end if;
 return null;
exception when others then return null;
end $$;

do $$
declare def text; n int;
  has_old constant text := $x$(jsonb_typeof(s.snapshot->'inventory')='array' and jsonb_array_length(s.snapshot->'inventory')>0)$x$;
  has_new constant text := $x$((jsonb_typeof(s.snapshot->'inventory')='array' and jsonb_array_length(s.snapshot->'inventory')>0) or coalesce((s.snapshot->>'has_inventory')::boolean,false))$x$;
  inject constant text := E'begin\n  if jsonb_typeof(p_snapshot->''inventory'')=''array'' then\n    p_snapshot := (p_snapshot - ''inventory'') || jsonb_build_object(''inventory_value'', public.trackstat_inventory_value(p_snapshot), ''has_inventory'', jsonb_array_length(p_snapshot->''inventory'')>0);\n  end if;\n';
  samp_old constant text := E' end if;\n insert into public.trackstat_samples';
  samp_new constant text := E' elsif p_snapshot ? ''inventory_value'' then v:=(p_snapshot->>''inventory_value'')::numeric;\n end if;\n insert into public.trackstat_samples';
  f record;
begin
  -- every function that reports has_inventory
  for f in select p.oid, pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.prokind='f' and pg_get_functiondef(p.oid) like '%'||has_old||'%' loop
    execute replace(f.d, has_old, has_new);
  end loop;

  def := pg_get_functiondef('public.trackstat_push(text,uuid,bigint,text,jsonb)'::regprocedure);
  n := (length(def)-length(replace(def, E'\nbegin\n', '')))/length(E'\nbegin\n');
  if n <> 1 then raise exception 'trackstat_push: expected one top-level begin, found %', n; end if;
  execute replace(def, E'\nbegin\n', E'\n'||inject);

  def := pg_get_functiondef('public.trackstat_record_sample(uuid,text,jsonb)'::regprocedure);
  n := (length(def)-length(replace(def, samp_old, '')))/length(samp_old);
  if n <> 1 then raise exception 'trackstat_record_sample: pattern found % times', n; end if;
  execute replace(def, samp_old, samp_new);
end $$;

update public.trackstat_sessions
set snapshot = (snapshot - 'inventory') || jsonb_build_object('inventory_value', public.trackstat_inventory_value(snapshot), 'has_inventory', jsonb_array_length(snapshot->'inventory')>0)
where jsonb_typeof(snapshot->'inventory')='array';

alter table public.trackstat_sessions enable trigger trackstat_daily_gains;

commit;
