-- JustGift — donation goals + extended stats + top donors. Idempotent.

alter table public.alert_settings
  add column if not exists goal_enabled boolean not null default false,
  add column if not exists goal_amount numeric(12, 2) not null default 0,
  add column if not exists goal_title text;

-- Extend dashboard stats with this-month donation COUNT (for usage limits).
-- DROP first: the return type (OUT columns) changed from the 0001 version.
drop function if exists public.my_donation_stats();
create or replace function public.my_donation_stats()
returns table (
  total numeric,
  donation_count bigint,
  month_total numeric,
  month_count bigint
)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(verified_amount), 0) as total,
    count(*) as donation_count,
    coalesce(
      sum(verified_amount) filter (where created_at >= date_trunc('month', now())),
      0
    ) as month_total,
    count(*) filter (where created_at >= date_trunc('month', now())) as month_count
  from public.donations
  where profile_id = auth.uid() and status = 'verified';
$$;

grant execute on function public.my_donation_stats() to authenticated;

-- Top donors this month for the calling streamer.
drop function if exists public.my_top_donors(int);
create or replace function public.my_top_donors(p_limit int default 5)
returns table (donor_name text, total numeric, donations bigint)
language sql stable security definer set search_path = public as $$
  select
    donor_name,
    sum(verified_amount) as total,
    count(*) as donations
  from public.donations
  where profile_id = auth.uid()
    and status = 'verified'
    and created_at >= date_trunc('month', now())
  group by donor_name
  order by total desc
  limit greatest(1, least(p_limit, 50));
$$;

grant execute on function public.my_top_donors(int) to authenticated;
