begin;
-- Keep historical rows under their original game ID; only active writers change.
alter table public.trackstat_sessions drop constraint trackstat_sessions_game_id_check;
alter table public.trackstat_sessions add constraint trackstat_sessions_game_id_check check(game_id in ('3317771874','10563114921','10708913337','10629695169'));
alter table public.trackstat_daily_gains drop constraint trackstat_daily_gains_game_id_check;
alter table public.trackstat_daily_gains add constraint trackstat_daily_gains_game_id_check check(game_id in ('3317771874','10563114921','10708913337','10629695169'));
alter table public.trackstat_samples drop constraint trackstat_samples_game_id_check;
alter table public.trackstat_samples add constraint trackstat_samples_game_id_check check(game_id in ('3317771874','10563114921','10708913337','10629695169'));

-- Patch current definitions rather than restoring old versions of auth/retention logic.
do $migration$
declare f record; def text; updated text;
begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('trackstat_push','trackstat_presence','trackstat_inventory','trackstat_shared_inventory','trackstat_inventory_account','trackstat_admin_games','trackstat_community_record','trackstat_record_daily_gains','trackstat_image_manifest') loop
  def := pg_get_functiondef(f.oid);
  updated := regexp_replace(def, $re$'3317771874',\s*'10563114921',\s*'10708913337'$re$, '''3317771874'',''10629695169'',''10708913337''', 'g');
  updated := replace(updated, $old$else array['pets','eggs','gear','items']$old$, $new$when '10629695169' then array['normal','golden','diamond','rainbow','items','potions'] else array['pets','eggs','gear','items']$new$);
  updated := replace(updated, $old$'petsimulator99','stealanegg','animedice'$old$, $new$'petsimulator99','tapsimulator','animedice'$new$);
  if updated=def then raise exception 'Trackstat migration anchor missing: %',f.proname; end if;
  execute updated;
 end loop;
end $migration$;

create table public.trackstats_tapsimulator (
  key text primary key check (length(key) between 1 and 120),
  kind text not null check (kind in ('pet','potion','item')),
  name text not null check (length(name) between 1 and 100),
  icon text check (icon ~ '^[0-9]{1,20}$'),
  rarity text check (length(rarity) <= 30),
  rarity_num integer,
  rarity_color text check (rarity_color ~ '^#[0-9a-f]{6}$'),
  description text check (length(description) <= 300),
  created_at timestamptz not null default now()
);
alter table public.trackstats_tapsimulator enable row level security;
revoke all on public.trackstats_tapsimulator from public, anon, authenticated;

create function public.trackstats_tapsimulator_catalog_missing(p_keys text[])
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(k), '{}') from unnest(p_keys[1:2000]) k
  where not exists (select 1 from public.trackstats_tapsimulator c where c.key = k);
$$;

create function public.trackstats_tapsimulator_catalog_add(p_key text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i jsonb; n integer := 0;
begin
  if not exists (select 1 from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')) then raise exception 'Invalid connection key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'Invalid items'; end if;
  for i in select * from jsonb_array_elements(p_items) loop
    insert into public.trackstats_tapsimulator(key, kind, name, icon, rarity, rarity_num, rarity_color, description)
    values (i->>'key', i->>'kind', i->>'name', nullif(i->>'icon', ''), i->>'rarity', (i->>'rarity_num')::integer, i->>'rarity_color', i->>'description')
    on conflict (key) do nothing;
    n := n + 1;
  end loop;
  return jsonb_build_object('received', n);
end $$;

create function public.trackstats_tapsimulator_catalog_read(p_keys text[],p_names text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.key,to_jsonb(c)-'key'-'created_at'),'{}'::jsonb)
  from public.trackstats_tapsimulator c
  where c.key=any(p_keys[1:2000]) or lower(c.name)=any(p_names[1:2000]);
$$;


create function public.trackstats_tapsimulator_public()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('game','Tap Simulator','accounts',count(distinct account_id),
 'sessions',count(distinct (account_id,(updated_at at time zone 'UTC')::date)),
 'live',(select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '10629695169'),
 'gained',jsonb_build_object(
'normal',coalesce(sum((gained->>'normal')::numeric),0),
'golden',coalesce(sum((gained->>'golden')::numeric),0),
'diamond',coalesce(sum((gained->>'diamond')::numeric),0),
'rainbow',coalesce(sum((gained->>'rainbow')::numeric),0),
'items',coalesce(sum((gained->>'items')::numeric),0),
'potions',coalesce(sum((gained->>'potions')::numeric),0)))
 from public.trackstat_community where game_id='10629695169' and updated_at>now()-interval '7 days';
$$;
revoke all on function public.trackstats_tapsimulator_catalog_missing(text[]),public.trackstats_tapsimulator_catalog_add(text,jsonb),public.trackstats_tapsimulator_catalog_read(text[],text[]),public.trackstats_tapsimulator_public() from public;
grant execute on function public.trackstats_tapsimulator_catalog_missing(text[]),public.trackstats_tapsimulator_catalog_add(text,jsonb),public.trackstats_tapsimulator_catalog_read(text[],text[]),public.trackstats_tapsimulator_public() to anon,authenticated;
drop policy "trackstats images insert new png" on storage.objects;
create policy "trackstats images insert new png" on storage.objects for insert to anon,authenticated
with check(bucket_id='trackstats-images' and name ~ '^(tapsimulator|petsimulator99|animedice)/[0-9]{1,20}\.png$');
notify pgrst,'reload schema';
commit;
