begin;

-- Total gem value of a snapshot's inventory; never fails a read.
create function public.trackstat_inventory_value(p_snapshot jsonb)
returns numeric language plpgsql immutable set search_path='' as $$
begin
 if jsonb_typeof(p_snapshot->'inventory')<>'array' then return null; end if;
 return (select coalesce(sum(coalesce((e->>'r')::numeric,0)*coalesce((e->>'a')::numeric,0)),0) from jsonb_array_elements(p_snapshot->'inventory') e);
exception when others then return null;
end $$;

-- p_slim = true leaves the inventory out of every session (the newest one reports its value and whether it has one); inventory is read on demand.
drop function public.trackstat_user_accounts_read(text[]);
drop function public.trackstat_private(text);
drop function public.trackstat_private_data(uuid);
create function public.trackstat_private_data(p_account uuid, p_slim boolean default false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a public.trackstat_accounts; sessions jsonb; active_games jsonb; daily jsonb;
begin
  select * into a from public.trackstat_accounts where id = p_account;
  if a.id is null then raise exception 'Invalid connection key'; end if;
  select coalesce(jsonb_agg(
      (case
        when not (s.id = (select l.id from public.trackstat_sessions l where l.account_id=a.id and l.game_id=s.game_id order by l.updated_at desc, l.id desc limit 1))
          then jsonb_set(to_jsonb(s), '{snapshot}', s.snapshot - 'inventory')
        when p_slim
          then jsonb_set(to_jsonb(s), '{snapshot}', (s.snapshot - 'inventory') || jsonb_build_object('inventory_value', public.trackstat_inventory_value(s.snapshot), 'has_inventory', (jsonb_typeof(s.snapshot->'inventory')='array' and jsonb_array_length(s.snapshot->'inventory')>0)))
        else to_jsonb(s) end)
      - 'account_id' - 'daily_checkpoint' || jsonb_build_object('history_expired', s.updated_at <= now()-interval '8 days') order by s.updated_at desc), '[]'::jsonb) into sessions
    from (
      (select * from public.trackstat_sessions where account_id=a.id and updated_at > now()-interval '8 days' order by updated_at desc limit 50)
      union
      (select distinct on (game_id) * from public.trackstat_sessions where account_id=a.id order by game_id, updated_at desc, id desc)
    ) s;
  active_games := public.trackstat_active_games(a.id, a.presence, a.presence_sessions);
  select coalesce(jsonb_agg(jsonb_build_object('day',day,'game_id',game_id,'gained',gained) order by day,game_id),'[]'::jsonb) into daily from public.trackstat_daily_gains where account_id=a.id and day >= (now() at time zone 'UTC')::date-7;
  return jsonb_build_object('account', jsonb_build_object('id',a.id,'username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions, 'activeGames',active_games,'daily',daily);
end $function$;
revoke all on function public.trackstat_private_data(uuid,boolean) from public,anon,authenticated;

create function public.trackstat_private(p_key text, p_slim boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid;
begin
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex');
 if a is null then raise exception 'Invalid connection key'; end if;
 return public.trackstat_private_data(a, p_slim);
end $$;
revoke all on function public.trackstat_private(text,boolean) from public;
grant execute on function public.trackstat_private(text,boolean) to anon,authenticated;

create function public.trackstat_user_accounts_read(p_skip_keys text[] default '{}', p_slim boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if cardinality(p_skip_keys) > 60 then raise exception 'Too many keys'; end if;
 return (select coalesce(jsonb_agg(public.trackstat_private_data(ua.account_id, p_slim) order by ua.created_at, ua.account_id),'[]'::jsonb)
 from public.trackstat_user_accounts ua
 where ua.user_id=auth.uid()
 and not exists(select 1 from public.trackstat_accounts k
   where k.id=ua.account_id and k.key_hash in (select encode(extensions.digest(x,'sha256'),'hex') from unnest(p_skip_keys) x)));
end $$;
revoke all on function public.trackstat_user_accounts_read(text[],boolean) from public,anon;
grant execute on function public.trackstat_user_accounts_read(text[],boolean) to authenticated;

-- The newest inventory of a Roblox account for one game, readable with one of its keys or through the signed-in email link.
create function public.trackstat_inventory(p_keys text[], p_roblox text, p_game text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r record;
begin
 if p_roblox is null or p_roblox !~ '^[0-9]{1,20}$' or p_game not in ('3317771874','10563114921') then raise exception 'Invalid request'; end if;
 if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
 select s.id, s.updated_at, s.snapshot->'inventory' as inventory into r
 from public.trackstat_sessions s join public.trackstat_accounts a on a.id=s.account_id
 where a.roblox_id=p_roblox and s.game_id=p_game
   and (a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
     or (auth.uid() is not null and exists(select 1 from public.trackstat_user_accounts u where u.user_id=auth.uid() and u.account_id=a.id)))
 order by s.updated_at desc, s.id desc limit 1;
 if r.id is null then return jsonb_build_object('inventory', null); end if;
 return jsonb_build_object('id', r.id, 'updated_at', r.updated_at, 'inventory', r.inventory);
end $$;
revoke all on function public.trackstat_inventory(text[],text,text) from public;
grant execute on function public.trackstat_inventory(text[],text,text) to anon,authenticated;

-- A tiny fingerprint of everything the page shows for these keys and the signed-in email, so an unchanged page downloads nothing.
create function public.trackstat_version(p_keys text[] default '{}')
returns text language plpgsql stable security definer set search_path='' as $$
declare v text; recent boolean;
begin
 if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
 with mine as (
   select a.id from public.trackstat_accounts a where a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
   union
   select ua.account_id from public.trackstat_user_accounts ua where ua.user_id=auth.uid()
 )
 select md5(coalesce(string_agg(m.id::text || ':' || x.presence_sessions::text || ':' || coalesce((select max(s.updated_at)::text from public.trackstat_sessions s where s.account_id=m.id),''), '|' order by m.id), '')),
        coalesce(bool_or(exists(select 1 from jsonb_each(x.presence_sessions) e where (e.value->>'seen_at')::timestamptz > now()-interval '10 minutes')), false)
 into v, recent
 from mine m join public.trackstat_accounts x on x.id=m.id;
 -- A library that stopped without saying so makes the account look offline on its own, so recent presence also changes the fingerprint every 30 seconds
 return v || case when recent then ':' || floor(extract(epoch from now())/30)::text else '' end;
end $$;
revoke all on function public.trackstat_version(text[]) from public;
grant execute on function public.trackstat_version(text[]) to anon,authenticated;

notify pgrst, 'reload schema';
commit;
