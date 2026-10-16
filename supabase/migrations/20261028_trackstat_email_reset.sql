begin;
create table public.trackstat_user_accounts (
 user_id uuid not null references auth.users(id) on delete cascade,
 account_id uuid not null references public.trackstat_accounts(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,account_id)
);
alter table public.trackstat_user_accounts enable row level security;
revoke all on public.trackstat_user_accounts from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.trackstat_private_data(p_account uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a public.trackstat_accounts; sessions jsonb; active_games jsonb; daily jsonb;
begin
  select * into a from public.trackstat_accounts where id = p_account;
  if a.id is null then raise exception 'Invalid connection key'; end if;
  select coalesce(jsonb_agg(to_jsonb(s) - 'account_id' - 'daily_checkpoint' || jsonb_build_object('history_expired', s.updated_at <= now()-interval '8 days') order by s.updated_at desc), '[]'::jsonb) into sessions
    from (
      (select * from public.trackstat_sessions where account_id=a.id and updated_at > now()-interval '8 days' order by updated_at desc limit 50)
      union
      (select distinct on (game_id) * from public.trackstat_sessions where account_id=a.id order by game_id, updated_at desc, id desc)
    ) s;
  active_games := public.trackstat_active_games(a.id, a.presence, a.presence_sessions);
  select coalesce(jsonb_agg(jsonb_build_object('day',day,'game_id',game_id,'gained',gained) order by day,game_id),'[]'::jsonb) into daily from public.trackstat_daily_gains where account_id=a.id and day >= (now() at time zone 'UTC')::date-7;
  return jsonb_build_object('account', jsonb_build_object('id',a.id,'username',a.username,'roblox_id',a.roblox_id), 'sessions',sessions, 'activeGames',active_games,'daily',daily);
end $function$
;

revoke all on function public.trackstat_private_data(uuid) from public,anon,authenticated;
create or replace function public.trackstat_private(p_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid;
begin
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex');
 if a is null then raise exception 'Invalid connection key'; end if;
 return public.trackstat_private_data(a);
end $$;
create function public.trackstat_user_accounts_read()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return (select coalesce(jsonb_agg(public.trackstat_private_data(account_id) order by created_at,account_id),'[]'::jsonb)
 from public.trackstat_user_accounts where user_id=auth.uid());
end $$;
create function public.trackstat_user_account_save(p_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Sign in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex') for share;
 if a is null then raise exception 'Invalid connection key'; end if;
 if not exists(select 1 from public.trackstat_user_accounts where user_id=u and account_id=a)
 and (select count(*) from public.trackstat_user_accounts where user_id=u)>=10 then raise exception 'Account limit reached'; end if;
 insert into public.trackstat_user_accounts(user_id,account_id) values(u,a) on conflict do nothing;
 return jsonb_build_object('saved',true);
end $$;
create function public.trackstat_user_account_remove(p_account uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 delete from public.trackstat_user_accounts where user_id=auth.uid() and account_id=p_account;
end $$;
revoke all on function public.trackstat_user_accounts_read(),public.trackstat_user_account_save(text),public.trackstat_user_account_remove(uuid) from public,anon;
grant execute on function public.trackstat_user_accounts_read(),public.trackstat_user_account_save(text),public.trackstat_user_account_remove(uuid) to authenticated;

-- A reset destroys the old identity and its private data, not just its key hash.
create function public.trackstat_reset_and_wipe(p_key text,p_new_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare h text; nh text; a public.trackstat_accounts;
begin
 if p_key is null or p_key !~ '^sp_[a-f0-9]{64}$' or p_new_key is null or p_new_key !~ '^sp_[a-f0-9]{64}$' or p_new_key=p_key then raise exception 'Invalid new key'; end if;
 h:=encode(extensions.digest(p_key,'sha256'),'hex'); nh:=encode(extensions.digest(p_new_key,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended(least(h,nh),0));
 perform pg_advisory_xact_lock(hashtextextended(greatest(h,nh),0));
 if exists(select 1 from public.trackstat_revoked_keys where key_hash=nh) or exists(select 1 from public.trackstat_accounts where key_hash=nh) then raise exception 'Invalid new key'; end if;
 select * into a from public.trackstat_accounts where key_hash=h for update;
 if a.id is null then raise exception 'Invalid connection key'; end if;
 insert into public.trackstat_revoked_keys(key_hash) values(h) on conflict do nothing;
 delete from public.trackstat_sessions where account_id=a.id;
 -- Daily gains, pruned session IDs, device requests and email links cascade.
 delete from public.trackstat_accounts where id=a.id;
 insert into public.trackstat_accounts(key_hash,roblox_id,username) values(nh,a.roblox_id,a.username);
 return jsonb_build_object('reset',true,'wiped',true);
end $$;
revoke all on function public.trackstat_reset_and_wipe(text,text) from public;
grant execute on function public.trackstat_reset_and_wipe(text,text) to anon,authenticated;
notify pgrst,'reload schema';
commit;
