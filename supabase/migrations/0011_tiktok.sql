-- Just Gift — TikTok marketing integration (admin-only, single brand account).
-- Stores the OAuth connection + a private bucket for videos staged before they
-- are pushed to the creator's TikTok inbox. Idempotent.

-- 1. Connection store. Service-role only (admin client) — never exposed to clients.
create table if not exists public.tiktok_connection (
  id                  uuid primary key default gen_random_uuid(),
  open_id             text not null,
  union_id            text,
  scope               text,
  access_token        text not null,
  refresh_token       text not null,
  expires_at          timestamptz not null,
  refresh_expires_at  timestamptz,
  display_name        text,
  avatar_url          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.tiktok_connection enable row level security;
-- Intentionally no policies: only the service-role key may read/write.

-- 2. Private bucket for staged videos (64MB cap = TikTok single-chunk limit).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tiktok-uploads', 'tiktok-uploads', false, 67108864,
        array['video/mp4','video/quicktime','video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins (is_admin) may manage staged uploads in this bucket.
drop policy if exists "tiktok_uploads_admin_all" on storage.objects;
create policy "tiktok_uploads_admin_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'tiktok-uploads'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    bucket_id = 'tiktok-uploads'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
