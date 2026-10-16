begin;

-- A secret read-only link to one account's stats. The token is the whole secret; deleting the row turns the link off.
create table public.trackstat_shares (
 token text primary key,
 account_id uuid not null unique references public.trackstat_accounts(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.trackstat_shares enable row level security;
revoke all on public.trackstat_shares from public,anon,authenticated;

create function public.trackstat_share_get(p_keys text[], p_roblox text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare t text;
begin
 select s.token into t from public.trackstat_shares s where s.account_id in (select public.trackstat_accessible_accounts(p_keys,p_roblox)) limit 1;
 return jsonb_build_object('active', t is not null, 'token', t);
end $$;

-- Makes the link (or returns the one that already exists). With several devices on one Roblox account it follows the newest.
create function public.trackstat_share_create(p_keys text[], p_roblox text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare existing text; chosen uuid; t text;
begin
 select s.token into existing from public.trackstat_shares s where s.account_id in (select public.trackstat_accessible_accounts(p_keys,p_roblox)) limit 1;
 if existing is not null then return jsonb_build_object('active', true, 'token', existing); end if;
 select x into chosen from public.trackstat_accessible_accounts(p_keys,p_roblox) x
  order by (select max(updated_at) from public.trackstat_sessions s where s.account_id=x) desc nulls last limit 1;
 if chosen is null then raise exception 'Invalid connection key'; end if;
 t := translate(encode(extensions.gen_random_bytes(24),'base64'), '+/=', '-_');
 insert into public.trackstat_shares(token, account_id) values (t, chosen);
 return jsonb_build_object('active', true, 'token', t);
end $$;

create function public.trackstat_share_revoke(p_keys text[], p_roblox text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 delete from public.trackstat_shares where account_id in (select public.trackstat_accessible_accounts(p_keys,p_roblox));
 return jsonb_build_object('active', false);
end $$;
revoke all on function public.trackstat_share_get(text[],text), public.trackstat_share_create(text[],text), public.trackstat_share_revoke(text[],text) from public;
grant execute on function public.trackstat_share_get(text[],text), public.trackstat_share_create(text[],text), public.trackstat_share_revoke(text[],text) to anon,authenticated;

-- What the public page shows: the same trimmed read the page uses (no inventory, no keys).
create function public.trackstat_shared(p_token text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a uuid;
begin
 if p_token is null or p_token !~ '^[A-Za-z0-9_-]{20,64}$' then raise exception 'Invalid link'; end if;
 select s.account_id into a from public.trackstat_shares s where s.token=p_token;
 if a is null then raise exception 'Invalid link'; end if;
 return public.trackstat_private_data(a, true);
end $$;
revoke all on function public.trackstat_shared(text) from public;
grant execute on function public.trackstat_shared(text) to anon,authenticated;

notify pgrst, 'reload schema';
commit;
