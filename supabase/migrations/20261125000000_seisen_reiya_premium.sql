-- Independent Reiya Premium data owned by Seisen Premium.
begin;

create table public.seisen_reiya_orders (
  id uuid primary key,
  plan text not null check (plan in ('monthly', 'yearly')),
  claim_hash text not null,
  legal_consent jsonb,
  paypal_subscription_id text unique,
  payer_email text,
  payer_id text,
  key_ciphertext text,
  email_delivery_status text,
  delivered_at timestamptz,
  refunded_at timestamptz,
  local_wipe_requested boolean not null default false,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index seisen_reiya_orders_payer_email on public.seisen_reiya_orders (payer_email, created_at desc);

create table public.seisen_reiya_licenses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.seisen_reiya_orders(id) on delete cascade,
  profile_id uuid not null unique default gen_random_uuid(),
  key_hash text not null unique,
  cloud_key_ciphertext text not null,
  display_name text not null default '',
  expires_at timestamptz not null,
  revoked boolean not null default false,
  billing_inactive boolean not null default false,
  max_devices integer not null default 3 check (max_devices between 1 and 10)
);

create table public.seisen_reiya_devices (
  license_id uuid not null references public.seisen_reiya_licenses(id) on delete cascade,
  device_hash text not null,
  primary key (license_id, device_hash)
);

create table public.seisen_reiya_sessions (
  token_hash text primary key,
  license_id uuid not null references public.seisen_reiya_licenses(id) on delete cascade,
  device_hash text not null,
  expires_at timestamptz not null,
  foreign key (license_id, device_hash) references public.seisen_reiya_devices(license_id, device_hash) on delete cascade
);

create table public.seisen_reiya_backups (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.seisen_reiya_licenses(id) on delete cascade,
  ciphertext text not null check (octet_length(ciphertext) <= 3000000),
  metadata jsonb not null,
  created_at timestamptz not null default now()
);
create index seisen_reiya_backups_profile_time on public.seisen_reiya_backups (license_id, created_at desc);

create table public.seisen_reiya_account_metadata (
  license_id uuid not null references public.seisen_reiya_licenses(id) on delete cascade,
  ownership_hash text not null,
  username text not null,
  display_name text not null,
  robux bigint not null check (robux >= 0),
  updated_at timestamptz not null default now(),
  primary key (license_id, ownership_hash)
);

create table public.seisen_reiya_refund_requests (
  id uuid primary key,
  order_id uuid not null unique references public.seisen_reiya_orders(id) on delete cascade,
  email text not null,
  reason text not null,
  status text not null check (status in ('pending', 'processing', 'refunded', 'rejected', 'failed')),
  created_at timestamptz not null,
  resolved_at timestamptz,
  refund_id text,
  sale_id text,
  erase_local_data boolean not null,
  erase_consent_at timestamptz,
  erase_consent_version text
);

create table public.seisen_reiya_rates (
  bucket text primary key,
  hits integer not null,
  resets_at timestamptz not null
);
create index seisen_reiya_rates_expiry on public.seisen_reiya_rates (resets_at);

alter table public.seisen_reiya_orders enable row level security;
alter table public.seisen_reiya_licenses enable row level security;
alter table public.seisen_reiya_devices enable row level security;
alter table public.seisen_reiya_sessions enable row level security;
alter table public.seisen_reiya_backups enable row level security;
alter table public.seisen_reiya_account_metadata enable row level security;
alter table public.seisen_reiya_rates enable row level security;
alter table public.seisen_reiya_refund_requests enable row level security;
revoke all on public.seisen_reiya_refund_requests from public, anon, authenticated;
grant select, insert, update, delete on public.seisen_reiya_refund_requests to service_role;

revoke all on public.seisen_reiya_orders, public.seisen_reiya_licenses, public.seisen_reiya_devices,
  public.seisen_reiya_sessions, public.seisen_reiya_backups, public.seisen_reiya_account_metadata,
  public.seisen_reiya_rates from public, anon, authenticated;
grant select, insert, update, delete on public.seisen_reiya_orders, public.seisen_reiya_licenses,
  public.seisen_reiya_devices, public.seisen_reiya_sessions, public.seisen_reiya_backups,
  public.seisen_reiya_account_metadata, public.seisen_reiya_rates to service_role;

create function public.seisen_reiya_rate(p_bucket text, p_limit integer, p_seconds integer)
returns boolean language plpgsql set search_path = '' as $routine$
declare updated_hits integer;
begin
  delete from public.seisen_reiya_rates where resets_at < now() - interval '1 day';
  insert into public.seisen_reiya_rates as r (bucket, hits, resets_at)
  values (p_bucket, 1, now() + make_interval(secs => p_seconds))
  on conflict (bucket) do update
    set hits = case when r.resets_at <= now() then 1 else least(r.hits, p_limit) + 1 end,
        resets_at = case when r.resets_at <= now() then excluded.resets_at else r.resets_at end
  returning hits into updated_hits;
  return updated_hits <= p_limit;
end;
$routine$;

create function public.seisen_reiya_fulfill(
  p_order uuid, p_subscription text, p_key_hash text, p_key_cipher text, p_cloud_cipher text, p_expires timestamptz
) returns uuid language plpgsql set search_path = '' as $routine$
declare
  purchaser public.seisen_reiya_orders;
  license_id uuid;
begin
  select * into purchaser from public.seisen_reiya_orders where id = p_order for update;
  if not found or purchaser.paypal_subscription_id is distinct from p_subscription
     or purchaser.refunded_at is not null or purchaser.revoked_at is not null or p_expires <= now() then
    return null;
  end if;
  select l.id into license_id from public.seisen_reiya_licenses l where l.order_id = p_order;
  if found then
    update public.seisen_reiya_licenses set expires_at = greatest(expires_at, p_expires), billing_inactive = false
    where id = license_id and not revoked;
    return license_id;
  end if;
  insert into public.seisen_reiya_licenses (order_id, key_hash, cloud_key_ciphertext, expires_at)
  values (p_order, p_key_hash, p_cloud_cipher, p_expires) returning id into license_id;
  update public.seisen_reiya_orders set key_ciphertext = p_key_cipher where id = p_order;
  return license_id;
end;
$routine$;

create function public.seisen_reiya_revoke(p_subscription text, p_refunded boolean)
returns void language plpgsql set search_path = '' as $routine$
declare matched_order uuid;
begin
  update public.seisen_reiya_orders
  set revoked_at = coalesce(revoked_at, now()),
      refunded_at = case when p_refunded then coalesce(refunded_at, now()) else refunded_at end,
      key_ciphertext = null
  where paypal_subscription_id = p_subscription returning id into matched_order;
  if not found then return; end if;
  update public.seisen_reiya_licenses as l set revoked = true where l.order_id = matched_order;
  if p_refunded then
    update public.seisen_reiya_refund_requests
    set status = 'refunded', resolved_at = coalesce(resolved_at, now())
    where order_id = matched_order;
  end if;
end;
$routine$;

create function public.seisen_reiya_activate(p_hash text, p_device text, p_token text, p_name text)
returns jsonb language plpgsql set search_path = '' as $routine$
declare license public.seisen_reiya_licenses;
begin
  select * into license from public.seisen_reiya_licenses where key_hash = p_hash for update;
  if not found or license.revoked or license.billing_inactive or license.expires_at <= now() then
    return jsonb_build_object('error', 'inactive');
  end if;
  if not exists (select 1 from public.seisen_reiya_devices where license_id = license.id and device_hash = p_device) then
    if (select count(*) from public.seisen_reiya_devices where license_id = license.id) >= license.max_devices then
      return jsonb_build_object('error', 'device_limit');
    end if;
    insert into public.seisen_reiya_devices (license_id, device_hash) values (license.id, p_device);
  end if;
  if length(p_name) > 0 then
    update public.seisen_reiya_licenses set display_name = left(p_name, 48)
    where id = license.id returning * into license;
  end if;
  delete from public.seisen_reiya_sessions where license_id = license.id and expires_at <= now();
  insert into public.seisen_reiya_sessions (token_hash, license_id, device_hash, expires_at)
  values (p_token, license.id, p_device, now() + interval '30 minutes');
  return jsonb_build_object('profile_id', license.profile_id, 'display_name', license.display_name,
    'expires_at', license.expires_at, 'cloud_key_ciphertext', license.cloud_key_ciphertext);
end;
$routine$;

create function public.seisen_reiya_backup(p_token text, p_ciphertext text, p_metadata jsonb)
returns uuid language plpgsql set search_path = '' as $routine$
declare owner_id uuid; backup_id uuid;
begin
  select l.id into owner_id from public.seisen_reiya_sessions s
  join public.seisen_reiya_licenses l on l.id = s.license_id
  where s.token_hash = p_token and s.expires_at > now() and l.expires_at > now() and not l.revoked and not l.billing_inactive
  for update of l;
  if not found then return null; end if;
  delete from public.seisen_reiya_backups where license_id = owner_id and created_at <= now() - interval '15 days';
  insert into public.seisen_reiya_backups (license_id, ciphertext, metadata)
  values (owner_id, p_ciphertext, p_metadata) returning id into backup_id;
  delete from public.seisen_reiya_backups b where b.id in (
    select old.id from public.seisen_reiya_backups old
    where old.license_id = owner_id order by old.created_at desc, old.id desc offset 5
  );
  return backup_id;
end;
$routine$;

revoke all on function public.seisen_reiya_rate(text, integer, integer),
  public.seisen_reiya_fulfill(uuid, text, text, text, text, timestamptz),
  public.seisen_reiya_revoke(text, boolean), public.seisen_reiya_activate(text, text, text, text),
  public.seisen_reiya_backup(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.seisen_reiya_rate(text, integer, integer),
  public.seisen_reiya_fulfill(uuid, text, text, text, text, timestamptz),
  public.seisen_reiya_revoke(text, boolean), public.seisen_reiya_activate(text, text, text, text),
  public.seisen_reiya_backup(text, text, jsonb) to service_role;
commit;
