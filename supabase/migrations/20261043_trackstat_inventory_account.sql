-- The website still checks keys and share links here, then reads the inventory itself from the Trackstat server (trackstat-server/).
begin;

create or replace function public.trackstat_inventory_account(p_keys text[], p_roblox text, p_game text)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare r uuid;
begin
 if p_roblox is null or p_roblox !~ '^[0-9]{1,20}$' or p_game not in ('3317771874','10563114921','10708913337') then raise exception 'Invalid request'; end if;
 if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
 select a.id into r
 from public.trackstat_sessions s join public.trackstat_accounts a on a.id=s.account_id
 where a.roblox_id=p_roblox and s.game_id=p_game
   and (a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
     or (auth.uid() is not null and exists(select 1 from public.trackstat_user_accounts u where u.user_id=auth.uid() and u.account_id=a.id)))
 order by s.updated_at desc, s.id desc limit 1;
 return r;
end $$;
revoke all on function public.trackstat_inventory_account(text[],text,text) from public;
grant execute on function public.trackstat_inventory_account(text[],text,text) to anon, authenticated;

create or replace function public.trackstat_shared_account(p_token text)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare a uuid;
begin
 if p_token is null or p_token !~ '^[A-Za-z0-9_-]{20,64}$' then raise exception 'Invalid link'; end if;
 select s.account_id into a from public.trackstat_shares s where s.token=p_token;
 if a is null then raise exception 'Invalid link'; end if;
 return a;
end $$;
revoke all on function public.trackstat_shared_account(text) from public;
grant execute on function public.trackstat_shared_account(text) to anon, authenticated;

commit;
