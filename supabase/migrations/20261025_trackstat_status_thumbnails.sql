begin;
CREATE OR REPLACE FUNCTION public.trackstat_active_games(p_account uuid, p_presence jsonb, p_sessions jsonb)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(jsonb_agg(distinct game_id),'[]'::jsonb) from (
    select value->>'game' as game_id from jsonb_each(p_sessions)
      where value->>'active'='true' and (value->>'seen_at')::timestamptz > now()-interval '120 seconds'
    union
    select key from jsonb_each_text(p_presence) legacy
      where value::timestamptz > now()-interval '120 seconds'
      and not exists(select 1 from jsonb_each(p_sessions) p where p.value->>'game'=legacy.key)

  ) active;
$function$
;
create function public.trackstats_stealanegg_catalog_read(p_keys text[],p_names text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.key,to_jsonb(c)-'key'-'created_at'),'{}'::jsonb)
  from public.trackstats_stealanegg c
  where c.key=any(p_keys[1:2000]) or lower(c.name)=any(p_names[1:2000]);
$$;
revoke all on function public.trackstats_stealanegg_catalog_read(text[],text[]) from public;
grant execute on function public.trackstats_stealanegg_catalog_read(text[],text[]) to anon,authenticated;

notify pgrst, 'reload schema';
commit;
