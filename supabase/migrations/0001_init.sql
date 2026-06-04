-- JustGift — initial schema, RLS, triggers, storage
-- Run in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      citext unique,
  display_name  text,
  avatar_url    text,
  bio           text,
  -- receiver matching for slip verification:
  receiver_name text,
  promptpay_id  text,
  bank_name     text,
  bank_account  text,
  -- secret capability token used in the OBS overlay URL:
  overlay_token uuid not null unique default gen_random_uuid(),
  plan          text not null default 'free' check (plan in ('free', 'pro', 'elite')),
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint username_format check (
    username is null or username ~ '^[a-z0-9_]{3,20}$'
  )
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- alert_settings (one row per profile)
-- ---------------------------------------------------------------------------
create table if not exists public.alert_settings (
  profile_id   uuid primary key references public.profiles (id) on delete cascade,
  min_amount   numeric(12, 2) not null default 1,
  duration_ms  int not null default 7000 check (duration_ms between 1000 and 30000),
  sound_url    text,
  image_url    text,
  animation    text not null default 'slide'
                 check (animation in ('slide', 'zoom', 'flip', 'glitch')),
  accent_color text not null default '#dc2626',
  text_color   text not null default '#ffffff',
  font         text not null default 'Rajdhani',
  tts_enabled  boolean not null default false,
  tts_voice    text,
  updated_at   timestamptz not null default now()
);

drop trigger if exists alert_settings_updated_at on public.alert_settings;
create trigger alert_settings_updated_at
  before update on public.alert_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- donations
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  donor_name       text not null,
  message          text,
  amount           numeric(12, 2) not null,     -- donor-claimed (display only)
  verified_amount  numeric(12, 2),              -- from the slip = source of truth
  currency         text not null default 'THB',
  status           text not null default 'pending'
                     check (status in ('pending', 'verified', 'rejected', 'shown')),
  slip_trans_ref   text unique,                 -- anti-replay (one slip = one use)
  sender_name      text,
  sender_bank      text,
  receiver_account text,
  slip_image_path  text,
  slip_data        jsonb,                        -- full RDCW response (audit)
  reject_reason    text,
  created_at       timestamptz not null default now(),
  shown_at         timestamptz
);

create index if not exists donations_profile_created_idx
  on public.donations (profile_id, created_at desc);
create index if not exists donations_status_idx
  on public.donations (profile_id, status);

-- ---------------------------------------------------------------------------
-- new-user trigger: create profile + alert_settings on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.alert_settings (profile_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.alert_settings enable row level security;
alter table public.donations enable row level security;

-- profiles: owner-only direct access (public read goes through the view below)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- alert_settings: owner only
drop policy if exists alert_settings_select_own on public.alert_settings;
create policy alert_settings_select_own on public.alert_settings
  for select using (auth.uid() = profile_id);

drop policy if exists alert_settings_update_own on public.alert_settings;
create policy alert_settings_update_own on public.alert_settings
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists alert_settings_insert_own on public.alert_settings;
create policy alert_settings_insert_own on public.alert_settings
  for insert with check (auth.uid() = profile_id);

-- donations: owner read only. ALL writes happen via the service-role key
-- (server actions) so verification can never be bypassed by a client.
drop policy if exists donations_select_own on public.donations;
create policy donations_select_own on public.donations
  for select using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- public profile view — only safe, donor-facing columns (no overlay_token)
-- security_invoker = false → runs as owner, bypassing profiles RLS, exposing
-- exactly the columns below to anonymous donors.
-- ---------------------------------------------------------------------------
create or replace view public.public_profiles
with (security_invoker = false) as
  select
    id,
    username,
    display_name,
    avatar_url,
    bio,
    promptpay_id,
    bank_name,
    bank_account,
    plan
  from public.profiles
  where onboarded = true;

grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- storage: private bucket for uploaded slips (audit/evidence)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'slips', 'slips', false, 5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do nothing;

-- donors are anonymous, so allow uploads into the slips bucket. Reads are
-- server-side only (service role / signed URLs).
drop policy if exists slips_insert_public on storage.objects;
create policy slips_insert_public on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'slips');

-- ---------------------------------------------------------------------------
-- Realtime: stream donation changes to the streamer's dashboard feed.
-- (The OBS overlay uses Broadcast, not this — see lib/supabase/broadcast.ts.)
-- ---------------------------------------------------------------------------
alter table public.donations replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'donations'
  ) then
    alter publication supabase_realtime add table public.donations;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Dashboard stats (uses the caller's own uid — safe under security definer).
-- ---------------------------------------------------------------------------
create or replace function public.my_donation_stats()
returns table (total numeric, donation_count bigint, month_total numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(verified_amount), 0) as total,
    count(*) as donation_count,
    coalesce(
      sum(verified_amount) filter (where created_at >= date_trunc('month', now())),
      0
    ) as month_total
  from public.donations
  where profile_id = auth.uid() and status = 'verified';
$$;

grant execute on function public.my_donation_stats() to authenticated;
