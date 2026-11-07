begin;
alter table public.trackstat_sessions drop constraint trackstat_sessions_game_id_check;
alter table public.trackstat_sessions add constraint trackstat_sessions_game_id_check check(game_id in ('3317771874','10563114921','10708913337','10629695169','994732206'));
alter table public.trackstat_daily_gains drop constraint trackstat_daily_gains_game_id_check;
alter table public.trackstat_daily_gains add constraint trackstat_daily_gains_game_id_check check(game_id in ('3317771874','10563114921','10708913337','10629695169','994732206'));
alter table public.trackstat_samples drop constraint trackstat_samples_game_id_check;
alter table public.trackstat_samples add constraint trackstat_samples_game_id_check check(game_id in ('3317771874','10563114921','10708913337','10629695169','994732206'));

-- Extend deployed definitions without replacing current auth, retention or replay checks.
do $migration$
declare f record; def text; updated text; processed integer := 0;
begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('trackstat_push','trackstat_presence','trackstat_inventory','trackstat_shared_inventory','trackstat_inventory_account','trackstat_admin_games','trackstat_community_record','trackstat_record_daily_gains','trackstat_image_manifest') loop
  def := pg_get_functiondef(f.oid);
  updated := regexp_replace(def, $re$('3317771874'(?:\s*,\s*'[0-9]+')+)$re$, $replacement$\1,'994732206'$replacement$, 'g');
  updated := replace(updated, $old$'petsimulator99','tapsimulator','animedice'$old$, $new$'petsimulator99','tapsimulator','animedice','bloxfruits'$new$);
  if f.proname in ('trackstat_push','trackstat_record_daily_gains','trackstat_community_record') then
   if strpos(updated,$anchor$when '10708913337' then$anchor$)=0 then raise exception 'Blox Fruits metric anchor missing: %',f.proname;end if;
   updated := replace(updated,$anchor$when '10708913337' then$anchor$,$metrics$when '994732206' then array['fruits','weapons','accessories','materials','items'] when '10708913337' then$metrics$);
  end if;
  if updated=def then raise exception 'Blox Fruits game anchor missing: %',f.proname;end if;
  execute updated;
  processed := processed + 1;
 end loop;
 if processed < 9 then raise exception 'Missing Trackstat definitions: found %',processed;end if;
end $migration$;
create table public.trackstats_bloxfruits (
  key text primary key check (length(key) between 1 and 120),
  kind text not null check (length(kind) between 1 and 40),
  name text not null check (length(name) between 1 and 100),
  icon text check (icon ~ '^[0-9]{1,20}$'),
  rarity text check (length(rarity) <= 30),
  rarity_num integer,
  rarity_color text check (rarity_color ~ '^#[0-9a-f]{6}$'),
  description text check (length(description) <= 300),
  created_at timestamptz not null default now()
);
alter table public.trackstats_bloxfruits enable row level security;
revoke all on public.trackstats_bloxfruits from public, anon, authenticated;

create function public.trackstats_bloxfruits_catalog_missing(p_keys text[])
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(k), '{}') from unnest(p_keys[1:2000]) k
  where not exists (select 1 from public.trackstats_bloxfruits c where c.key = k);
$$;

create function public.trackstats_bloxfruits_catalog_add(p_key text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i jsonb; n integer := 0;
begin
  if not exists (select 1 from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')) then raise exception 'Invalid connection key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'Invalid items'; end if;
  for i in select * from jsonb_array_elements(p_items) loop
    insert into public.trackstats_bloxfruits(key, kind, name, icon, rarity, rarity_num, rarity_color, description)
    values (i->>'key', i->>'kind', i->>'name', nullif(i->>'icon', ''), i->>'rarity', (i->>'rarity_num')::integer, i->>'rarity_color', i->>'description')
    on conflict (key) do nothing;
    n := n + 1;
  end loop;
  return jsonb_build_object('received', n);
end $$;

create function public.trackstats_bloxfruits_catalog_read(p_keys text[],p_names text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(c.key,to_jsonb(c)-'key'-'created_at'),'{}'::jsonb)
  from public.trackstats_bloxfruits c
  where c.key=any(p_keys[1:2000]) or lower(c.name)=any(p_names[1:2000]);
$$;



create function public.trackstats_bloxfruits_public()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('game','Blox Fruits','accounts',count(distinct account_id),
 'sessions',count(distinct (account_id,(updated_at at time zone 'UTC')::date)),
 'live',(select count(*) from public.trackstat_accounts a where public.trackstat_active_games(a.id,a.presence,a.presence_sessions) ? '994732206'),
 'gained',jsonb_build_object(
 'fruits',coalesce(sum((gained->>'fruits')::numeric),0),
 'weapons',coalesce(sum((gained->>'weapons')::numeric),0),
 'accessories',coalesce(sum((gained->>'accessories')::numeric),0),
 'materials',coalesce(sum((gained->>'materials')::numeric),0),
 'items',coalesce(sum((gained->>'items')::numeric),0)))
 from public.trackstat_community where game_id='994732206' and updated_at>now()-interval '7 days';
$$;
revoke all on function public.trackstats_bloxfruits_catalog_missing(text[]),public.trackstats_bloxfruits_catalog_add(text,jsonb),public.trackstats_bloxfruits_catalog_read(text[],text[]),public.trackstats_bloxfruits_public() from public;
grant execute on function public.trackstats_bloxfruits_catalog_missing(text[]),public.trackstats_bloxfruits_catalog_add(text,jsonb),public.trackstats_bloxfruits_catalog_read(text[],text[]),public.trackstats_bloxfruits_public() to anon,authenticated;
drop policy "trackstats images insert new png" on storage.objects;
create policy "trackstats images insert new png" on storage.objects for insert to anon,authenticated
with check(bucket_id='trackstats-images' and name ~ '^(tapsimulator|petsimulator99|animedice|bloxfruits)/[0-9]{1,20}\.png$');
notify pgrst,'reload schema';
commit;
