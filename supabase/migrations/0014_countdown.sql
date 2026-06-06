-- Just Gift — donation countdown timer (viewers donate to add time) +
-- "live now" presence heartbeat for the admin dashboard.

create table if not exists public.countdowns (
  profile_id       uuid primary key references public.profiles(id) on delete cascade,
  enabled          boolean not null default false,
  running          boolean not null default false,
  ends_at          timestamptz,           -- absolute end while running
  remaining_ms     integer not null default 0, -- frozen time while paused
  baht_per_unit    numeric(12, 2) not null default 10,
  minutes_per_unit numeric(8, 2) not null default 1,
  updated_at       timestamptz not null default now()
);

alter table public.countdowns enable row level security;

-- Owner manages their own timer from the dashboard. Overlay + donate flow read
-- and write via the service-role key (bypasses RLS).
drop policy if exists "countdowns_owner_all" on public.countdowns;
create policy "countdowns_owner_all" on public.countdowns
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Heartbeat timestamp: the overlay pings this so admins can see who's live.
alter table public.profiles
  add column if not exists last_overlay_at timestamptz;
