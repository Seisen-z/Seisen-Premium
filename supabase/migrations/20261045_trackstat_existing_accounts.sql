-- The Trackstat server asks which of its accounts still exist, so inventories of deleted or reset accounts can be removed there.
begin;

create or replace function public.trackstat_existing_accounts(p_ids uuid[])
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(id), '{}') from public.trackstat_accounts where cardinality(p_ids) <= 500 and id = any(p_ids);
$$;
revoke all on function public.trackstat_existing_accounts(uuid[]) from public;
grant execute on function public.trackstat_existing_accounts(uuid[]) to anon, authenticated;

commit;
