-- JustGift — subscription packages (prepaid, PromptPay via Stripe). Idempotent.

alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

create table if not exists public.subscription_payments (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles (id) on delete cascade,
  package_id            text not null,
  tier                  text not null check (tier in ('pro', 'elite')),
  days                  int not null,
  amount                numeric(12, 2) not null,
  currency              text not null default 'THB',
  method                text not null default 'stripe',
  status                text not null default 'paid'
                          check (status in ('pending', 'paid', 'failed')),
  stripe_session_id     text unique,
  stripe_payment_intent text,
  period_start          timestamptz,
  period_end            timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists subscription_payments_profile_idx
  on public.subscription_payments (profile_id, created_at desc);

alter table public.subscription_payments enable row level security;

-- Owner can read their own payment history; all writes go via the service role.
drop policy if exists subpay_select_own on public.subscription_payments;
create policy subpay_select_own on public.subscription_payments
  for select using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- Activate/extend a subscription. Switching tiers starts a fresh period from
-- now; renewing the same tier stacks onto the remaining time. Returns the new
-- expiry. Privileged — only the service role may call it.
-- ---------------------------------------------------------------------------
create or replace function public.apply_subscription(
  p_profile uuid,
  p_tier text,
  p_days int
)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  cur_plan text;
  cur_expiry timestamptz;
  base timestamptz;
  new_expiry timestamptz;
begin
  select plan, plan_expires_at into cur_plan, cur_expiry
  from public.profiles where id = p_profile;

  if cur_plan is distinct from p_tier then
    base := now();
  else
    base := greatest(now(), coalesce(cur_expiry, now()));
  end if;

  new_expiry := base + make_interval(days => p_days);

  update public.profiles
  set plan = p_tier, plan_expires_at = new_expiry
  where id = p_profile;

  return new_expiry;
end;
$$;

revoke all on function public.apply_subscription(uuid, text, int)
  from public, anon, authenticated;
grant execute on function public.apply_subscription(uuid, text, int)
  to service_role;

-- ---------------------------------------------------------------------------
-- Downgrade lapsed subscriptions (call from a daily cron). Returns the count.
-- ---------------------------------------------------------------------------
create or replace function public.expire_subscriptions()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  with expired as (
    update public.profiles
    set plan = 'free', plan_expires_at = null
    where plan <> 'free'
      and plan_expires_at is not null
      and plan_expires_at < now()
    returning 1
  )
  select count(*) into n from expired;
  return n;
end;
$$;

revoke all on function public.expire_subscriptions()
  from public, anon, authenticated;
grant execute on function public.expire_subscriptions() to service_role;
