begin;
-- Devices of the same Roblox account are now combined by the website; the approval hand-off is gone.
drop function if exists public.trackstat_link_request(text,text,text), public.trackstat_link_pending(text), public.trackstat_link_decide(text,uuid,boolean), public.trackstat_link_pickup(text);
drop table if exists public.trackstat_link_requests;
notify pgrst, 'reload schema';
commit;
