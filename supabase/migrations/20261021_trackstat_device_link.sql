begin;

-- A new device for a Roblox account that already has a history asks to join it. The owner approves on the website,
-- which hands the existing key to that device once. Requests expire after 15 minutes.
create table public.trackstat_link_requests (
  id uuid primary key default gen_random_uuid(),
  nonce_hash text not null unique,
  roblox_id text not null check (roblox_id ~ '^[0-9]{1,20}$'),
  username text not null check (length(username) between 1 and 50),
  account_id uuid not null references public.trackstat_accounts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  handoff_key text,
  created_at timestamptz not null default now()
);
create index trackstat_link_requests_account on public.trackstat_link_requests(account_id, created_at desc);
alter table public.trackstat_link_requests enable row level security;
revoke all on public.trackstat_link_requests from public, anon, authenticated;

-- Device side: ask to join the history of this Roblox account, if one exists.
create function public.trackstat_link_request(p_nonce text, p_roblox_id text, p_username text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare h text; a uuid; n integer; existing public.trackstat_link_requests;
begin
  if p_nonce is null or p_nonce !~ '^[a-f0-9]{32,64}$' or p_roblox_id is null or p_roblox_id !~ '^[0-9]{1,20}$' or p_username is null or length(p_username) not between 1 and 50 then raise exception 'Invalid request'; end if;
  h := encode(extensions.digest(p_nonce, 'sha256'), 'hex');
  delete from public.trackstat_link_requests where created_at < now() - interval '15 minutes';
  select * into existing from public.trackstat_link_requests where nonce_hash = h;
  if existing.id is not null then return jsonb_build_object('status', existing.status); end if;
  select id into a from public.trackstat_accounts where roblox_id = p_roblox_id order by created_at limit 1;
  if a is null then return jsonb_build_object('status', 'none'); end if;
  select count(*) into n from public.trackstat_link_requests where account_id = a and status = 'pending';
  if n >= 3 then raise exception 'Too many pending requests'; end if;
  insert into public.trackstat_link_requests(nonce_hash, roblox_id, username, account_id) values (h, p_roblox_id, p_username, a);
  return jsonb_build_object('status', 'pending');
end $$;

-- Owner side: the pending requests for the account this key belongs to.
create function public.trackstat_link_pending(p_key text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'username', r.username, 'created_at', r.created_at) order by r.created_at desc), '[]'::jsonb)
  from public.trackstat_link_requests r join public.trackstat_accounts a on a.id = r.account_id
  where a.key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') and r.status = 'pending' and r.created_at > now() - interval '15 minutes';
$$;

-- Owner side: approve (hands this key to the device once) or deny.
create function public.trackstat_link_decide(p_key text, p_id uuid, p_approve boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a uuid; done integer;
begin
  select id into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if a is null then raise exception 'Invalid connection key'; end if;
  update public.trackstat_link_requests
    set status = case when p_approve then 'approved' else 'denied' end, handoff_key = case when p_approve then p_key end
    where id = p_id and account_id = a and status = 'pending' and created_at > now() - interval '15 minutes';
  get diagnostics done = row_count;
  if done = 0 then raise exception 'Request not found'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- Device side: collect the answer. The key is returned once and then forgotten.
create function public.trackstat_link_pickup(p_nonce text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.trackstat_link_requests;
begin
  select * into r from public.trackstat_link_requests where nonce_hash = encode(extensions.digest(coalesce(p_nonce, ''), 'sha256'), 'hex');
  if r.id is null or r.created_at < now() - interval '15 minutes' then return jsonb_build_object('status', 'expired'); end if;
  if r.status = 'pending' then return jsonb_build_object('status', 'pending'); end if;
  delete from public.trackstat_link_requests where id = r.id;
  if r.status = 'approved' then return jsonb_build_object('status', 'approved', 'key', r.handoff_key); end if;
  return jsonb_build_object('status', 'denied');
end $$;

revoke all on function public.trackstat_link_request(text,text,text), public.trackstat_link_pending(text), public.trackstat_link_decide(text,uuid,boolean), public.trackstat_link_pickup(text) from public;
grant execute on function public.trackstat_link_request(text,text,text), public.trackstat_link_pending(text), public.trackstat_link_decide(text,uuid,boolean), public.trackstat_link_pickup(text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
