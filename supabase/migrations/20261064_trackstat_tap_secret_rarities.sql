begin;
do $migration$
declare f record;def text;updated text;
 old constant text := $old$when '10629695169' then array['normal','golden','diamond','rainbow','items','potions']$old$;
 new constant text := $new$when '10629695169' then array['secret1','secret2','secret3','secretx','items','potions']$new$;
begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('trackstat_push','trackstat_record_daily_gains','trackstat_community_record') loop
  def:=pg_get_functiondef(f.oid);
  if (length(def)-length(replace(def,old,'')))/length(old) <> 1 then raise exception 'Missing Tap metric anchor: %',f.proname;end if;
  if f.proname='trackstat_push' then
   -- Older clients can finish/reload without an Invalid count loop; new clients use only secret counters.
   updated:=replace(def,old,$compat$when '10629695169' then case when (p_snapshot->'owned') ? 'secret1' then array['secret1','secret2','secret3','secretx','items','potions'] else array['normal','golden','diamond','rainbow','items','potions'] end$compat$);
  else updated:=replace(def,old,new);
  end if;
  execute updated;
 end loop;
end $migration$;
create or replace function public.trackstats_tapsimulator_public()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('game','Tap Simulator','accounts',count(distinct account_id),
 'sessions',count(distinct (account_id,(updated_at at time zone 'UTC')::date)),
 'live',(select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '10629695169'),
 'gained',jsonb_build_object(
 'secret1',coalesce(sum((gained->>'secret1')::numeric),0),
 'secret2',coalesce(sum((gained->>'secret2')::numeric),0),
 'secret3',coalesce(sum((gained->>'secret3')::numeric),0),
 'secretx',coalesce(sum((gained->>'secretx')::numeric),0),
 'items',coalesce(sum((gained->>'items')::numeric),0),
 'potions',coalesce(sum((gained->>'potions')::numeric),0)))
 from public.trackstat_community where game_id='10629695169' and updated_at>now()-interval '7 days';
$$;
notify pgrst,'reload schema';
commit;
