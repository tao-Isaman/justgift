-- Just Donate — public profile customization fields. Idempotent.

alter table public.profiles
  add column if not exists banner_url       text,
  add column if not exists accent_color     text,
  add column if not exists socials          jsonb   not null default '{}'::jsonb,
  add column if not exists suggested_amounts integer[] not null default '{}'::integer[],
  add column if not exists show_goal        boolean not null default true,
  add column if not exists show_leaderboard boolean not null default true;

-- Recreate the public view to expose the new presentation fields to donors.
-- DROP first to avoid column-change errors (see 0005).
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = false) as
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.banner_url,
    p.accent_color,
    p.socials,
    p.suggested_amounts,
    p.show_goal,
    p.show_leaderboard,
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
