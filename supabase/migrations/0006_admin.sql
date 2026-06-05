-- JustGift — admin portal. Idempotent.
-- Make yourself an admin afterwards:
--   update public.profiles set is_admin = true where username = 'yourname';

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- Platform overview (service-role only — the /admin route is gated separately).
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
  month_sub_revenue numeric
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
       where status = 'paid' and method = 'stripe' and created_at >= date_trunc('month', now()));
$$;

revoke all on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_overview() to service_role;

-- ---------------------------------------------------------------------------
-- Searchable user list with per-streamer totals (service-role only).
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
  total_raised numeric
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
    coalesce(d.total, 0) as total_raised
  from public.profiles p
  left join (
    select profile_id, count(*) as cnt, sum(verified_amount) as total
    from public.donations
    where status = 'verified'
    group by profile_id
  ) d on d.profile_id = p.id
  where p_search = ''
     or p.username ilike '%' || p_search || '%'
     or coalesce(p.display_name, '') ilike '%' || p_search || '%'
  order by p.created_at desc
  limit greatest(1, least(p_limit, 200))
  offset greatest(0, p_offset);
$$;

revoke all on function public.admin_users(text, int, int) from public, anon, authenticated;
grant execute on function public.admin_users(text, int, int) to service_role;
