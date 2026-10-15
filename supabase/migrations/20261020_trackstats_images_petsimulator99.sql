begin;

-- Pet Simulator 99 pictures live next to the Steal An Egg ones; still only NEW small PNGs, never overwrites.
drop policy "trackstats images insert new png" on storage.objects;
create policy "trackstats images insert new png" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'trackstats-images' and name ~ '^(stealanegg|petsimulator99)/[0-9]{1,20}\.png$');

commit;
