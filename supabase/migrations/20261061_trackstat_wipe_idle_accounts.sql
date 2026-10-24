-- An account with no library heartbeat and no saved sync for 15 days is deleted completely: the account, its key record, sessions, gains,
-- samples, activity, share links and any website link all go with it. The Trackstat server drops its inventory within the hour.
-- If the player comes back, the library registers a fresh account with the same key; a connected player pastes the key on the website again.
begin;

create or replace function public.trackstat_wipe_idle_accounts(p_days integer default 15)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare idle uuid[]; total integer; removed integer;
begin
  p_days := greatest(coalesce(p_days, 15), 15); -- never faster than 15 days, whatever is passed
  select count(*) into total from public.trackstat_accounts;
  select coalesce(array_agg(a.id), '{}') into idle from public.trackstat_accounts a
  where greatest(a.created_at,
      coalesce((select max((v->>'seen_at')::timestamptz) from jsonb_each(a.presence_sessions) e(k, v)), a.created_at),
      coalesce((select max(s.updated_at) from public.trackstat_sessions s where s.account_id = a.id), a.created_at)
    ) < now() - make_interval(days => p_days);
  -- Safety: a mistake must never empty the table
  if cardinality(idle) > 50 and cardinality(idle) > total * 0.9 then
    return jsonb_build_object('wiped', 0, 'skipped', 'would remove almost every account', 'idle', cardinality(idle), 'total', total);
  end if;
  -- Sessions do not cascade with the account; everything else (gains, samples, activity, shares, website links, community rows) does
  delete from public.trackstat_sessions where account_id = any(idle);
  delete from public.trackstat_accounts where id = any(idle);
  get diagnostics removed = row_count;
  return jsonb_build_object('wiped', removed, 'total_before', total);
end $$;
revoke all on function public.trackstat_wipe_idle_accounts(integer) from public, anon, authenticated;

select cron.schedule('trackstat-wipe-idle-accounts', '50 * * * *', $job$select public.trackstat_wipe_idle_accounts(15)$job$);

commit;
