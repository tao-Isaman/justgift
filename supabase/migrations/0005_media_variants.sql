-- JustGift — media share + amount-tier alert variants. Idempotent.

alter table public.alert_settings
  add column if not exists media_enabled boolean not null default false,
  add column if not exists media_min_amount numeric(12, 2) not null default 100,
  add column if not exists media_max_seconds int not null default 30
    check (media_max_seconds between 5 and 120),
  add column if not exists variants jsonb not null default '[]'::jsonb;

alter table public.donations
  add column if not exists media_url text;

-- Recreate the public view to expose media flags to donors (so the donation
-- page can show the media field). DROP first to avoid column-change errors.
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = false) as
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.promptpay_id,
    p.bank_name,
    p.bank_account,
    p.plan,
    coalesce(a.media_enabled, false) as media_enabled,
    coalesce(a.media_min_amount, 100) as media_min_amount
  from public.profiles p
  left join public.alert_settings a on a.profile_id = p.id
  where p.onboarded = true;

grant select on public.public_profiles to anon, authenticated;
