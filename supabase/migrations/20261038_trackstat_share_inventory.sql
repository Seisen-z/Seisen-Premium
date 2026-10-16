begin;

-- The newest inventory of a shared account for one game, readable with its share token only.
create function public.trackstat_shared_inventory(p_token text, p_game text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a uuid; r record;
begin
 if p_token is null or p_token !~ '^[A-Za-z0-9_-]{20,64}$' or p_game is null or p_game not in ('3317771874','10563114921') then raise exception 'Invalid link'; end if;
 select s.account_id into a from public.trackstat_shares s where s.token=p_token;
 if a is null then raise exception 'Invalid link'; end if;
 select s.id, s.updated_at, s.snapshot->'inventory' as inventory into r
 from public.trackstat_sessions s where s.account_id=a and s.game_id=p_game order by s.updated_at desc, s.id desc limit 1;
 if r.id is null then return jsonb_build_object('inventory', null); end if;
 return jsonb_build_object('updated_at', r.updated_at, 'inventory', r.inventory);
end $$;
revoke all on function public.trackstat_shared_inventory(text,text) from public;
grant execute on function public.trackstat_shared_inventory(text,text) to anon,authenticated;

notify pgrst, 'reload schema';
commit;
