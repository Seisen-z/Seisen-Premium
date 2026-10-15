begin;

-- One catalog table per game so categories, icons and rarity fields never collide when more games are added.
alter table public.trackstat_catalog rename to trackstats_petsimulator99;

create or replace function public.trackstat_catalog_missing(p_keys text[])
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(k), '{}') from unnest(p_keys[1:2000]) k
  where not exists (select 1 from public.trackstats_petsimulator99 c where c.key = k);
$$;

create or replace function public.trackstat_catalog_add(p_key text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i jsonb; n integer := 0;
begin
  if not exists (select 1 from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')) then raise exception 'Invalid connection key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'Invalid items'; end if;
  for i in select * from jsonb_array_elements(p_items) loop
    insert into public.trackstats_petsimulator99(key, class, name, icon, rarity, rarity_num, rarity_color, description)
    values (i->>'key', i->>'class', i->>'name', nullif(i->>'icon', ''), i->>'rarity', (i->>'rarity_num')::integer, i->>'rarity_color', i->>'description')
    on conflict (key) do nothing;
    n := n + 1;
  end loop;
  return jsonb_build_object('received', n);
end $$;

create or replace function public.trackstat_catalog_read(p_keys text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.key, to_jsonb(c) - 'key' - 'created_at'), '{}'::jsonb)
  from public.trackstats_petsimulator99 c where c.key = any (p_keys[1:2000]);
$$;

notify pgrst, 'reload schema';
commit;
