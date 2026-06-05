-- Just Donate — membership stats, member self-serve, public page helpers,
-- and admin extensions. Idempotent.

-- ---------------------------------------------------------------------------
-- Streamer membership stats (caller-scoped via auth.uid()).
-- ---------------------------------------------------------------------------
create or replace function public.my_member_stats()
returns table (
  member_count   bigint,
  active_count   bigint,
  total_revenue  numeric,
  month_revenue  numeric
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.memberships where streamer_id = auth.uid()),
    (select count(*) from public.memberships
       where streamer_id = auth.uid() and period_end > now()),
    (select coalesce(sum(amount), 0) from public.membership_payments
       where streamer_id = auth.uid() and status = 'paid'),
    (select coalesce(sum(amount), 0) from public.membership_payments
       where streamer_id = auth.uid() and status = 'paid'
         and created_at >= date_trunc('month', now()));
$$;

grant execute on function public.my_member_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Memberships the caller HOLDS (member self-serve page), with streamer info.
-- ---------------------------------------------------------------------------
create or replace function public.my_memberships()
returns table (
  id                   uuid,
  streamer_id          uuid,
  streamer_username    text,
  streamer_display_name text,
  streamer_avatar_url  text,
  tier_name            text,
  status               text,
  period_start         timestamptz,
  period_end           timestamptz,
  total_paid           numeric
)
language sql stable security definer set search_path = public as $$
  select
    m.id,
    m.streamer_id,
    p.username::text,
    p.display_name,
    p.avatar_url,
    m.tier_name,
    m.status,
    m.period_start,
    m.period_end,
    m.total_paid
  from public.memberships m
  join public.profiles p on p.id = m.streamer_id
  where m.member_id = auth.uid()
  order by (m.period_end > now()) desc, m.period_end desc;
$$;

grant execute on function public.my_memberships() to authenticated;

-- ---------------------------------------------------------------------------
-- Public page helpers (anon-callable; resolve a username → onboarded streamer).
-- ---------------------------------------------------------------------------
create or replace function public.public_top_donors(p_username citext, p_limit int default 5)
returns table (donor_name text, total numeric, donations bigint)
language sql stable security definer set search_path = public as $$
  select d.donor_name, sum(d.verified_amount) as total, count(*) as donations
  from public.donations d
  join public.profiles p on p.id = d.profile_id
  where p.username = p_username and p.onboarded
    and d.status = 'verified'
    and d.created_at >= date_trunc('month', now())
  group by d.donor_name
  order by total desc
  limit greatest(1, least(p_limit, 50));
$$;

grant execute on function public.public_top_donors(citext, int) to anon, authenticated;

create or replace function public.public_goal(p_username citext)
returns table (enabled boolean, title text, target numeric, raised numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(a.goal_enabled, false) as enabled,
    a.goal_title as title,
    coalesce(a.goal_amount, 0) as target,
    coalesce((
      select sum(d.verified_amount)
      from public.donations d
      where d.profile_id = p.id and d.status = 'verified'
    ), 0) as raised
  from public.profiles p
  left join public.alert_settings a on a.profile_id = p.id
  where p.username = p_username and p.onboarded;
$$;

grant execute on function public.public_goal(citext) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin overview — add membership counts + revenue (return type changed → DROP).
-- ---------------------------------------------------------------------------
drop function if exists public.admin_overview();
create function public.admin_overview()
returns table (
  streamers bigint,
  onboarded bigint,
  pro_active bigint,
  elite_active bigint,
  donations_count bigint,
  donations_total numeric,
  month_donations_count bigint,
  month_donations_total numeric,
  sub_revenue numeric,
  month_sub_revenue numeric,
  members_count bigint,
  active_members bigint,
  membership_revenue numeric,
  month_membership_revenue numeric
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where onboarded),
    (select count(*) from public.profiles
       where plan = 'pro' and (plan_expires_at is null or plan_expires_at > now())),
    (select count(*) from public.profiles
       where plan = 'elite' and (plan_expires_at is null or plan_expires_at > now())),
    (select count(*) from public.donations where status = 'verified'),
    (select coalesce(sum(verified_amount), 0) from public.donations where status = 'verified'),
    (select count(*) from public.donations
       where status = 'verified' and created_at >= date_trunc('month', now())),
    (select coalesce(sum(verified_amount), 0) from public.donations
       where status = 'verified' and created_at >= date_trunc('month', now())),
    (select coalesce(sum(amount), 0) from public.subscription_payments
       where status = 'paid' and method = 'stripe'),
    (select coalesce(sum(amount), 0) from public.subscription_payments
       where status = 'paid' and method = 'stripe' and created_at >= date_trunc('month', now())),
    (select count(*) from public.memberships),
    (select count(*) from public.memberships where period_end > now()),
    (select coalesce(sum(amount), 0) from public.membership_payments where status = 'paid'),
    (select coalesce(sum(amount), 0) from public.membership_payments
       where status = 'paid' and created_at >= date_trunc('month', now()));
$$;

revoke all on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_overview() to service_role;

-- ---------------------------------------------------------------------------
-- Admin user list — add per-streamer member count + membership revenue (DROP).
-- ---------------------------------------------------------------------------
drop function if exists public.admin_users(text, int, int);
create function public.admin_users(
  p_search text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  username text,
  display_name text,
  plan text,
  plan_expires_at timestamptz,
  created_at timestamptz,
  is_admin boolean,
  donations_count bigint,
  total_raised numeric,
  member_count bigint,
  membership_revenue numeric
)
language sql stable security definer set search_path = public as $$
  select
    p.id,
    p.username::text,
    p.display_name,
    p.plan,
    p.plan_expires_at,
    p.created_at,
    p.is_admin,
    coalesce(d.cnt, 0) as donations_count,
    coalesce(d.total, 0) as total_raised,
    coalesce(m.cnt, 0) as member_count,
    coalesce(mp.total, 0) as membership_revenue
  from public.profiles p
  left join (
    select profile_id, count(*) as cnt, sum(verified_amount) as total
    from public.donations
    where status = 'verified'
    group by profile_id
  ) d on d.profile_id = p.id
  left join (
    select streamer_id, count(*) as cnt
    from public.memberships
    where period_end > now()
    group by streamer_id
  ) m on m.streamer_id = p.id
  left join (
    select streamer_id, sum(amount) as total
    from public.membership_payments
    where status = 'paid'
    group by streamer_id
  ) mp on mp.streamer_id = p.id
  where p_search = ''
     or p.username ilike '%' || p_search || '%'
     or coalesce(p.display_name, '') ilike '%' || p_search || '%'
  order by p.created_at desc
  limit greatest(1, least(p_limit, 200))
  offset greatest(0, p_offset);
$$;

revoke all on function public.admin_users(text, int, int) from public, anon, authenticated;
grant execute on function public.admin_users(text, int, int) to service_role;
