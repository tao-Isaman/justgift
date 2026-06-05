-- Just Donate — public bucket for streamer avatar/banner uploads. Idempotent.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media', 'public-media', true, 5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Anyone can read (bucket is public). Authenticated users manage only their own
-- folder: paths are stored as `{auth.uid()}/...`.
drop policy if exists public_media_read on storage.objects;
create policy public_media_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'public-media');

drop policy if exists public_media_insert on storage.objects;
create policy public_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists public_media_update on storage.objects;
create policy public_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists public_media_delete on storage.objects;
create policy public_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
