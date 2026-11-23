-- Tap Simulator (10629695169) and Anime Dice (10708913337) are no longer tracked.
-- Deletes their stored data and the functions/tables only they used. Safe to run twice.
begin;

-- Stored rows for the two games
delete from public.trackstat_community where game_id in ('10629695169','10708913337');
delete from public.trackstat_daily_activity where game_id in ('10629695169','10708913337');
delete from public.trackstat_samples where game_id in ('10629695169','10708913337');
delete from public.trackstat_daily_gains where game_id in ('10629695169','10708913337');
delete from public.trackstat_sessions where game_id in ('10629695169','10708913337');

-- Live presence the accounts still carry for them
update public.trackstat_accounts
set presence = coalesce(presence, '{}'::jsonb) - '10629695169' - '10708913337',
    presence_sessions = coalesce(presence_sessions, '{}'::jsonb) - '10629695169' - '10708913337'
where presence ? '10629695169' or presence ? '10708913337' or presence_sessions ? '10629695169' or presence_sessions ? '10708913337';

-- Catalog tables and functions that belonged to one game only (every overload)
do $drop$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'trackstats_animedice_public', 'trackstats_animedice_catalog_missing', 'trackstats_animedice_catalog_add', 'trackstats_animedice_catalog_read',
      'trackstats_tapsimulator_public', 'trackstats_tapsimulator_catalog_missing', 'trackstats_tapsimulator_catalog_add', 'trackstats_tapsimulator_catalog_read')
  loop execute 'drop function if exists ' || f.sig || ' cascade'; end loop;
end
$drop$;
drop table if exists public.trackstats_animedice cascade;
drop table if exists public.trackstats_tapsimulator cascade;

-- Only the remaining games may be stored from now on
alter table public.trackstat_sessions drop constraint if exists trackstat_sessions_game_id_check;
alter table public.trackstat_sessions add constraint trackstat_sessions_game_id_check check(game_id in ('3317771874','10563114921','994732206'));
alter table public.trackstat_daily_gains drop constraint if exists trackstat_daily_gains_game_id_check;
alter table public.trackstat_daily_gains add constraint trackstat_daily_gains_game_id_check check(game_id in ('3317771874','10563114921','994732206'));
alter table public.trackstat_samples drop constraint if exists trackstat_samples_game_id_check;
alter table public.trackstat_samples add constraint trackstat_samples_game_id_check check(game_id in ('3317771874','10563114921','994732206'));

commit;
