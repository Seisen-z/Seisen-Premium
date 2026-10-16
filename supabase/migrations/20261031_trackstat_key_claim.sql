begin;

-- A key linked to an email account can only be linked again by that same email.
create or replace function public.trackstat_user_account_save(p_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Sign in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex') for share;
 if a is null then raise exception 'Invalid connection key'; end if;
 if exists(select 1 from public.trackstat_user_accounts where account_id=a and user_id<>u) then raise exception 'Key belongs to another account'; end if;
 if not exists(select 1 from public.trackstat_user_accounts where user_id=u and account_id=a)
 and (select count(*) from public.trackstat_user_accounts where user_id=u)>=10 then raise exception 'Account limit reached'; end if;
 insert into public.trackstat_user_accounts(user_id,account_id) values(u,a) on conflict do nothing;
 return jsonb_build_object('saved',true);
end $$;

-- Whether a key is already linked to an email, and whether it is the signed-in one.
create function public.trackstat_key_claim(p_key text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a uuid;
begin
 select id into a from public.trackstat_accounts where key_hash=encode(extensions.digest(p_key,'sha256'),'hex');
 if a is null then raise exception 'Invalid connection key'; end if;
 return jsonb_build_object('claimed',exists(select 1 from public.trackstat_user_accounts where account_id=a),
  'mine',auth.uid() is not null and exists(select 1 from public.trackstat_user_accounts where account_id=a and user_id=auth.uid()));
end $$;
revoke all on function public.trackstat_key_claim(text) from public;
grant execute on function public.trackstat_key_claim(text) to anon,authenticated;

notify pgrst, 'reload schema';
commit;
