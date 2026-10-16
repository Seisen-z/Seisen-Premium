begin;

-- Lets the database send a message to a Discord webhook without waiting for it.
create extension if not exists pg_net with schema extensions;

-- One webhook per Roblox account (shared by every device of that account); the address is never read back out.
create table public.trackstat_webhooks (
 account_id uuid primary key references public.trackstat_accounts(id) on delete cascade,
 url text not null,
 last_sent timestamptz,
 created_at timestamptz not null default now()
);
alter table public.trackstat_webhooks enable row level security;
revoke all on public.trackstat_webhooks from public,anon,authenticated;

-- Accounts of one Roblox id that the caller may use: through one of its keys, or through the signed-in email link.
create function public.trackstat_accessible_accounts(p_keys text[], p_roblox text)
returns setof uuid language plpgsql stable security definer set search_path='' as $$
begin
 if p_roblox is null or p_roblox !~ '^[0-9]{1,20}$' then raise exception 'Invalid request'; end if;
 if cardinality(p_keys) > 60 then raise exception 'Too many keys'; end if;
 return query select a.id from public.trackstat_accounts a
  where a.roblox_id=p_roblox
  and (a.key_hash in (select encode(extensions.digest(k,'sha256'),'hex') from unnest(p_keys) k)
    or (auth.uid() is not null and exists(select 1 from public.trackstat_user_accounts u where u.user_id=auth.uid() and u.account_id=a.id)));
end $$;
revoke all on function public.trackstat_accessible_accounts(text[],text) from public,anon,authenticated;

create function public.trackstat_webhook_get(p_keys text[], p_roblox text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u text;
begin
 select w.url into u from public.trackstat_webhooks w where w.account_id in (select public.trackstat_accessible_accounts(p_keys,p_roblox)) limit 1;
 return jsonb_build_object('configured', u is not null, 'hint', case when u is null then null else 'discord.com/api/webhooks/…' || right(u, 4) end);
end $$;

-- An empty address removes the webhook.
create function public.trackstat_webhook_set(p_keys text[], p_roblox text, p_url text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare ids uuid[];
begin
 select coalesce(array_agg(x),'{}') into ids from public.trackstat_accessible_accounts(p_keys,p_roblox) x;
 if cardinality(ids)=0 then raise exception 'Invalid connection key'; end if;
 if p_url is null or btrim(p_url)='' then
  delete from public.trackstat_webhooks where account_id=any(ids);
  return jsonb_build_object('configured', false);
 end if;
 if p_url !~ '^https://(ptb[.]|canary[.])?(discord|discordapp)[.]com/api/webhooks/[0-9]{15,25}/[A-Za-z0-9_-]{30,120}$' then raise exception 'That is not a Discord webhook address'; end if;
 insert into public.trackstat_webhooks(account_id,url) select unnest(ids), p_url on conflict (account_id) do update set url=excluded.url, last_sent=null;
 return jsonb_build_object('configured', true);
end $$;

create function public.trackstat_webhook_test(p_keys text[], p_roblox text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare w record;
begin
 select * into w from public.trackstat_webhooks where account_id in (select public.trackstat_accessible_accounts(p_keys,p_roblox)) limit 1;
 if w.account_id is null then raise exception 'No webhook is set'; end if;
 if w.last_sent > now()-interval '5 seconds' then raise exception 'Wait a few seconds before testing again'; end if;
 update public.trackstat_webhooks set last_sent=now() where account_id=w.account_id;
 perform net.http_post(url := w.url,
  body := jsonb_build_object('username','Trackstat','allowed_mentions',jsonb_build_object('parse','[]'::jsonb),
   'embeds',jsonb_build_array(jsonb_build_object('title','Trackstat alerts are on','description','You will get a message here when a Huge, Titanic or Gargantuan pet drops.','color',7559413))),
  headers := '{"Content-Type":"application/json"}'::jsonb);
 return jsonb_build_object('sent', true);
end $$;
revoke all on function public.trackstat_webhook_get(text[],text), public.trackstat_webhook_set(text[],text,text), public.trackstat_webhook_test(text[],text) from public;
grant execute on function public.trackstat_webhook_get(text[],text), public.trackstat_webhook_set(text[],text,text), public.trackstat_webhook_test(text[],text) to anon,authenticated;

-- Called from a save when this account has a webhook: sends one message for new Huge, Titanic or Gargantuan pets.
-- Names come from the library, so only plain characters are kept and mentions are switched off.
create function public.trackstat_notify_drops(p_account uuid, p_old jsonb, p_new jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare w record; r record; embeds jsonb := '[]'::jsonb; who text; clean text;
begin
 select * into w from public.trackstat_webhooks where account_id=p_account;
 if w.account_id is null or w.last_sent > now()-interval '3 seconds' then return; end if;
 select regexp_replace(a.username, '[^A-Za-z0-9 ]', '', 'g') into who from public.trackstat_accounts a where a.id=p_account;
 for r in
  select left(regexp_replace(d->>'name', '[^A-Za-z0-9 .!:()+-]', '', 'g'), 60) as name, d->>'kind' as kind,
   ((d->>'gained')::numeric - coalesce((select (o->>'gained')::numeric from jsonb_array_elements(p_old->'details') o where o->>'name'=d->>'name' and o->>'kind'=d->>'kind' limit 1), 0)) as got
  from jsonb_array_elements(p_new->'details') d
  where d->>'kind' in ('huge','titanic','gargantuan')
  limit 40
 loop
  continue when r.got <= 0 or jsonb_array_length(embeds) >= 5;
  embeds := embeds || jsonb_build_array(jsonb_build_object('title', initcap(r.kind) || ' pet', 'color', case r.kind when 'huge' then 16753920 when 'titanic' then 15158332 else 10181046 end,
   'description', '**' || coalesce(who,'Someone') || '** got **' || r.name || '**' || case when r.got > 1 then ' x' || r.got::bigint else '' end));
 end loop;
 if jsonb_array_length(embeds)=0 then return; end if;
 update public.trackstat_webhooks set last_sent=now() where account_id=p_account;
 perform net.http_post(url := w.url,
  body := jsonb_build_object('username','Trackstat','allowed_mentions',jsonb_build_object('parse','[]'::jsonb),'embeds',embeds),
  headers := '{"Content-Type":"application/json"}'::jsonb);
end $$;
revoke all on function public.trackstat_notify_drops(uuid,jsonb,jsonb) from public,anon,authenticated;

-- Same as 20261034, plus the Discord alert above.
CREATE OR REPLACE FUNCTION public.trackstat_push(p_key text, p_session uuid, p_sequence bigint, p_game text, p_snapshot jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a uuid; metric text; side text; n numeric; old public.trackstat_sessions; metrics text[]; last_push timestamptz;
begin
  select id into a from public.trackstat_accounts where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') for update;
  if a is null then raise exception 'Invalid connection key'; end if;
  if p_game is null or p_game not in ('3317771874', '10563114921') or p_sequence is null or p_sequence < 1 then raise exception 'Invalid session'; end if;
  metrics := case p_game when '3317771874' then array['items','huge','titanic','gargantuan'] else array['pets','eggs','gear','items'] end;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' or octet_length(p_snapshot::text) > 200000 then raise exception 'Invalid snapshot'; end if;
  foreach side in array array['owned','gained'] loop
    foreach metric in array metrics loop
      n := (p_snapshot #>> array[side,metric])::numeric;
      if n is null or n < 0 or n > 1000000000000000 or n <> trunc(n) then raise exception 'Invalid count'; end if;
    end loop;
  end loop;
  if jsonb_typeof(p_snapshot->'details') is distinct from 'array' or jsonb_array_length(p_snapshot->'details') > 500 then raise exception 'Invalid details'; end if;
  if p_snapshot ? 'inventory' and (jsonb_typeof(p_snapshot->'inventory') <> 'array' or jsonb_array_length(p_snapshot->'inventory') > 1000) then raise exception 'Invalid inventory'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_session::text, 0));
  select * into old from public.trackstat_sessions where id = p_session;
  if old.id is not null then
    if old.account_id <> a or old.game_id <> p_game then raise exception 'Session mismatch'; end if;
    if p_sequence <= old.sequence then return jsonb_build_object('accepted', false, 'sequence', old.sequence); end if;
    foreach metric in array metrics loop
      if (p_snapshot #>> array['gained',metric])::numeric < (old.snapshot #>> array['gained',metric])::numeric then raise exception 'Session totals must increase'; end if;
    end loop;
  end if;
  if exists(select 1 from public.trackstat_pruned_sessions where id=p_session) then
    return jsonb_build_object('accepted',false,'expired',true);
  end if;
  select (push_at->>p_game)::timestamptz into last_push from public.trackstat_accounts where id=a;
  if last_push > clock_timestamp()-interval '15 seconds' then
    return jsonb_build_object('accepted',false,'rateLimited',true,'retryAfter',greatest(1,ceil(extract(epoch from last_push+interval '15 seconds'-clock_timestamp()))));
  end if;
  -- Only the game's global exist counts changed: keep the saved copy and its timestamp (refreshed at most every 10 minutes) so an account with nothing new costs nothing
  if old.id is not null and old.updated_at > now()-interval '10 minutes' and public.trackstat_snapshot_core(old.snapshot) = public.trackstat_snapshot_core(p_snapshot) then
    begin
      perform public.trackstat_record_sample(a,p_game,p_snapshot);
    exception when others then null;
    end;
    return jsonb_build_object('accepted', true, 'sequence', p_sequence, 'unchanged', true);
  end if;
  insert into public.trackstat_sessions(id,account_id,game_id,sequence,snapshot)
    values(p_session,a,p_game,p_sequence,p_snapshot)
    on conflict(id) do update set sequence=excluded.sequence, snapshot=excluded.snapshot, updated_at=now();
  update public.trackstat_accounts set push_at=jsonb_set(push_at,array[p_game],to_jsonb(clock_timestamp())) where id=a;
  -- A new Huge, Titanic or Gargantuan pet goes to the account's Discord webhook, if it has one; never allowed to fail a save
  if old.id is not null and p_game = '3317771874' then
    begin
      perform public.trackstat_notify_drops(a, old.snapshot, p_snapshot);
    exception when others then null;
    end;
  end if;
  perform public.trackstat_trim_sessions(a,p_game);
  begin
    perform public.trackstat_record_sample(a,p_game,p_snapshot);
  exception when others then null;
  end;
  return jsonb_build_object('accepted', true, 'sequence', p_sequence);
end $function$;

notify pgrst, 'reload schema';
commit;
