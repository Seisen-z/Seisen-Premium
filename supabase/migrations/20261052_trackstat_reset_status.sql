begin;

-- A reset retains only an account label and its previous website owners, never tracking data.
create table public.trackstat_reset_connections (
 id uuid primary key,
 key_hash text not null unique,
 history jsonb not null,
 created_at timestamptz not null default now(),
 user_ids uuid[] not null default '{}'
);
alter table public.trackstat_reset_connections enable row level security;
revoke all on public.trackstat_reset_connections from public, anon, authenticated;

create function public.trackstat_remember_reset()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.trackstat_revoked_keys where key_hash=old.key_hash) then
  insert into public.trackstat_reset_connections(id,key_hash,history,user_ids)
  values(old.id,old.key_hash,
   jsonb_build_object('account',jsonb_build_object('id',old.id,'username',old.username,'roblox_id',old.roblox_id),
     'sessions','[]'::jsonb,'daily','[]'::jsonb,'activeGames','[]'::jsonb,'connectionStatus','reset'),
   array(select user_id from public.trackstat_user_accounts where account_id=old.id));
 end if;
 return old;
end $$;
revoke all on function public.trackstat_remember_reset() from public, anon, authenticated;
create trigger trackstat_remember_reset before delete on public.trackstat_accounts
for each row execute function public.trackstat_remember_reset();

create or replace function public.trackstat_private(p_key text, p_slim boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; marker jsonb;
begin
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex');
 if a is not null then return public.trackstat_private_data(a,p_slim); end if;
 select history into marker from public.trackstat_reset_connections where key_hash=encode(extensions.digest(p_key,'sha256'),'hex');
 if marker is null then raise exception 'Invalid connection key'; end if;
 return marker;
end $$;

create or replace function public.trackstat_user_accounts_read(p_skip_keys text[] default '{}', p_slim boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if cardinality(p_skip_keys)>60 then raise exception 'Too many keys'; end if;
 return (select coalesce(jsonb_agg(history order by sort_at,id),'[]'::jsonb) from (
  select ua.created_at sort_at, ua.account_id id, public.trackstat_private_data(ua.account_id,p_slim) history
  from public.trackstat_user_accounts ua where ua.user_id=auth.uid()
  and not exists(select 1 from public.trackstat_accounts k where k.id=ua.account_id
   and k.key_hash in (select encode(extensions.digest(x,'sha256'),'hex') from unnest(p_skip_keys) x))
  union all
  select r.created_at,r.id,r.history from public.trackstat_reset_connections r where auth.uid()=any(r.user_ids)
  and r.key_hash not in (select encode(extensions.digest(x,'sha256'),'hex') from unnest(p_skip_keys) x)
 ) records);
end $$;

create or replace function public.trackstat_user_account_remove(p_account uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 delete from public.trackstat_user_accounts where user_id=auth.uid() and account_id=p_account;
 update public.trackstat_reset_connections set user_ids=array_remove(user_ids,auth.uid())
 where id=p_account and auth.uid()=any(user_ids);
end $$;

create or replace function public.trackstat_version(p_keys text[] default '{}')
returns text language plpgsql stable security definer set search_path='' as $$
declare v text; resets text;
begin
 if cardinality(p_keys)>60 then raise exception 'Too many keys'; end if;
 with mine as (
  select a.id from public.trackstat_accounts a where a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
  union select ua.account_id from public.trackstat_user_accounts ua where ua.user_id=auth.uid()
 )
 select md5(coalesce(string_agg(m.id::text || ':' || public.trackstat_active_games(x.id,x.presence,x.presence_sessions)::text || ':' ||
  coalesce((select max(s.updated_at)::text from public.trackstat_sessions s where s.account_id=m.id),''),'|' order by m.id),''))
 into v from mine m join public.trackstat_accounts x on x.id=m.id;
 select coalesce(string_agg(id::text,'|' order by id),'') into resets from public.trackstat_reset_connections
 where key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k) or auth.uid()=any(user_ids);
 return md5(v || ':' || resets);
end $$;

notify pgrst,'reload schema';
commit;
