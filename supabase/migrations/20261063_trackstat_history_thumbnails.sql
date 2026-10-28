begin;

-- Keep the one-argument reader for older clients; names also resolve items no longer owned.
create function public.trackstat_catalog_read(p_keys text[],p_names text[])
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_object_agg(c.key,to_jsonb(c)-'key'-'created_at'),'{}'::jsonb)
 from public.trackstats_petsimulator99 c
 where c.key=any(p_keys[1:2000]) or lower(c.name)=any(p_names[1:2000]);
$$;
revoke all on function public.trackstat_catalog_read(text[],text[]) from public;
grant execute on function public.trackstat_catalog_read(text[],text[]) to anon,authenticated;
notify pgrst,'reload schema';
commit;
