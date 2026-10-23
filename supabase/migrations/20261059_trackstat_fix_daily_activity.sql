-- Daily Activity counted every sync again. The trigger ran BEFORE insert, and every library sync is "insert ... on conflict update", which
-- runs the insert trigger first with an empty checkpoint, so the whole session total was added on each sync (a pet gained once showed +28).
-- Fix: run AFTER the row is saved (like the daily gains counter), keep the checkpoint with a separate update, and rebuild the inflated rows.
begin;
lock table public.trackstat_sessions in share row exclusive mode;

drop trigger if exists trackstat_daily_activity on public.trackstat_sessions;

create or replace function public.trackstat_record_daily_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare d jsonb; k text; prior numeric; increment numeric; checkpoint jsonb;
begin
  checkpoint := case when tg_op = 'UPDATE' then old.activity_checkpoint else '{}'::jsonb end;
  for d in select * from jsonb_array_elements(new.snapshot->'details') loop
    k := jsonb_build_array(d->>'kind', d->>'name')::text;
    prior := coalesce((checkpoint->>k)::numeric, 0);
    increment := greatest(coalesce((d->>'gained')::numeric, 0) - prior, 0);
    checkpoint := jsonb_set(checkpoint, array[k], to_jsonb(prior + increment));
    if increment > 0 then
      insert into public.trackstat_daily_activity as a(account_id, game_id, day, kind, name, gained, owned, at)
      values (new.account_id, new.game_id, (new.updated_at at time zone 'UTC')::date, d->>'kind', d->>'name', increment, coalesce((d->>'owned')::numeric, 0), new.updated_at)
      on conflict (account_id, game_id, day, kind, name) do update
        set gained = a.gained + excluded.gained, owned = excluded.owned, at = excluded.at;
    end if;
  end loop;
  if new.activity_checkpoint is distinct from checkpoint then
    update public.trackstat_sessions set activity_checkpoint = checkpoint where id = new.id;
  end if;
  return new;
end $$;
revoke all on function public.trackstat_record_daily_activity() from public, anon, authenticated;

create trigger trackstat_daily_activity after insert or update of snapshot on public.trackstat_sessions
for each row execute function public.trackstat_record_daily_activity();

-- Rebuild: the inflated rows cannot be corrected, so they are replaced by what the stored sessions prove.
delete from public.trackstat_daily_activity;
update public.trackstat_sessions s set activity_checkpoint = coalesce((
  select jsonb_object_agg(jsonb_build_array(d->>'kind', d->>'name')::text, to_jsonb((d->>'gained')::numeric))
  from jsonb_array_elements(s.snapshot->'details') d), '{}'::jsonb);
insert into public.trackstat_daily_activity (account_id, game_id, day, kind, name, gained, owned, at)
select s.account_id, s.game_id, (s.updated_at at time zone 'UTC')::date, d->>'kind', d->>'name', sum((d->>'gained')::numeric), max((d->>'owned')::numeric), max(s.updated_at)
from public.trackstat_sessions s cross join lateral jsonb_array_elements(s.snapshot->'details') d
where (s.started_at at time zone 'UTC')::date = (s.updated_at at time zone 'UTC')::date
  and (s.updated_at at time zone 'UTC')::date >= (now() at time zone 'UTC')::date - 6
  and (d->>'gained')::numeric > 0
group by s.account_id, s.game_id, (s.updated_at at time zone 'UTC')::date, d->>'kind', d->>'name';

-- The cached website pages must reload
do $patch$
declare def text;
begin
  def := pg_get_functiondef('public.trackstat_version(text[])'::regprocedure);
  if strpos(def, 'daily-activity-v3:') > 0 then
    execute replace(def, 'daily-activity-v3:', 'daily-activity-v4:');
  end if;
end $patch$;

notify pgrst, 'reload schema';
commit;
