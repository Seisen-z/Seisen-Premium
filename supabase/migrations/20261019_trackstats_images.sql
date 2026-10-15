begin;

-- Public bucket for item/pet pictures captured by the library (the game's own icons are private on Roblox's side).
-- Anyone can read; the library may only add NEW small PNG files under stealanegg/, never overwrite or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trackstats-images', 'trackstats-images', true, 102400, array['image/png'])
on conflict (id) do nothing;

create policy "trackstats images insert new png" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'trackstats-images' and name ~ '^stealanegg/[0-9]{1,20}\.png$');

commit;
