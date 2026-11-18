begin;
create or replace function public.trackstat_private(p_key text, p_slim boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid;
begin
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex');
 if a is null then raise exception 'Invalid connection key'; end if;
 return public.trackstat_private_data(a, p_slim);
end $$;

create or replace function public.trackstat_user_accounts_read(p_skip_keys text[] default '{}', p_slim boolean default false)
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

create or replace function public.trackstat_user_account_remove(p_account uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 delete from public.trackstat_user_accounts where user_id=auth.uid() and account_id=p_account;
end $$;

create or replace function public.trackstat_version(p_keys text[] default '{}')
returns text language plpgsql stable security definer set search_path='' as $$
declare v text;
begin
 if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
 with mine as (
   select a.id from public.trackstat_accounts a where a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
   union
   select ua.account_id from public.trackstat_user_accounts ua where ua.user_id=auth.uid()
 )
 select md5(coalesce(string_agg(m.id::text || ':' || public.trackstat_active_games(x.id, x.presence, x.presence_sessions)::text || ':' || coalesce((select max(s.updated_at)::text from public.trackstat_sessions s where s.account_id=m.id),''), '|' order by m.id), ''))
 into v
 from mine m join public.trackstat_accounts x on x.id=m.id;
 return v;
end $$;


drop trigger trackstat_remember_reset on public.trackstat_accounts;
drop function public.trackstat_remember_reset();
drop table public.trackstat_reset_connections;
notify pgrst,'reload schema';
commit;