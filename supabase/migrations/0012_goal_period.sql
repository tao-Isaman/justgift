-- Just Gift — configurable goal period. goal_period_days = 0 means all-time;
-- N > 0 counts only donations from the last N days (rolling window).

alter table public.alert_settings
  add column if not exists goal_period_days int not null default 0;

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
        and (
          coalesce(a.goal_period_days, 0) = 0
          or d.created_at >= now() - make_interval(days => a.goal_period_days)
        )
    ), 0) as raised
  from public.profiles p
  left join public.alert_settings a on a.profile_id = p.id
  where p.username = p_username and p.onboarded;
$$;

grant execute on function public.public_goal(citext) to anon, authenticated;
