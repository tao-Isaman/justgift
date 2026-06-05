-- Just Donate — viewer memberships (verify-only via slip, streamer-defined tiers).
-- A viewer transfers to the streamer's existing PromptPay/bank, uploads a slip,
-- RDCW verifies it (right account, amount >= tier price, fresh, unused), and the
-- membership period is granted/extended. No custody, no Stripe — mirrors donations.
-- Idempotent.

-- Optional on-stream "new member" alert (reuses the overlay broadcast channel).
alter table public.alert_settings
  add column if not exists member_alert boolean not null default false;

-- ---------------------------------------------------------------------------
-- membership_tiers — streamer-defined tiers (name, price, duration, perks)
-- ---------------------------------------------------------------------------
create table if not exists public.membership_tiers (
  id          uuid primary key default gen_random_uuid(),
  streamer_id uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  price       numeric(12, 2) not null check (price > 0),
  days        int not null default 30 check (days between 1 and 3650),
  perks       text[] not null default '{}'::text[],
  color       text not null default '#dc2626',
  sort        int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists membership_tiers_streamer_idx
  on public.membership_tiers (streamer_id, sort);

drop trigger if exists membership_tiers_updated_at on public.membership_tiers;
create trigger membership_tiers_updated_at
  before update on public.membership_tiers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- memberships — current state, one row per (streamer, member)
-- ---------------------------------------------------------------------------
create table if not exists public.memberships (
  id           uuid primary key default gen_random_uuid(),
  streamer_id  uuid not null references public.profiles (id) on delete cascade,
  member_id    uuid not null references public.profiles (id) on delete cascade,
  member_name  text not null,
  tier_id      uuid references public.membership_tiers (id) on delete set null,
  tier_name    text not null,
  status       text not null default 'active' check (status in ('active', 'expired')),
  period_start timestamptz not null default now(),
  period_end   timestamptz not null,
  total_paid   numeric(12, 2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (streamer_id, member_id)
);

create index if not exists memberships_streamer_idx
  on public.memberships (streamer_id, period_end desc);
create index if not exists memberships_member_idx
  on public.memberships (member_id, period_end desc);

drop trigger if exists memberships_updated_at on public.memberships;
create trigger memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- membership_payments — append-only slip ledger (one row per verified slip)
-- ---------------------------------------------------------------------------
create table if not exists public.membership_payments (
  id               uuid primary key default gen_random_uuid(),
  streamer_id      uuid not null references public.profiles (id) on delete cascade,
  member_id        uuid references public.profiles (id) on delete set null,
  membership_id    uuid references public.memberships (id) on delete set null,
  tier_id          uuid references public.membership_tiers (id) on delete set null,
  tier_name        text not null,
  member_name      text not null,
  amount           numeric(12, 2) not null,
  days             int not null,
  currency         text not null default 'THB',
  status           text not null default 'paid' check (status in ('paid')),
  slip_trans_ref   text unique,                 -- anti-replay (one slip = one use)
  sender_name      text,
  sender_bank      text,
  receiver_account text,
  slip_image_path  text,
  slip_data        jsonb,                        -- full RDCW response (audit)
  created_at       timestamptz not null default now()
);

create index if not exists membership_payments_streamer_idx
  on public.membership_payments (streamer_id, created_at desc);
create index if not exists membership_payments_member_idx
  on public.membership_payments (member_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.membership_tiers enable row level security;
alter table public.memberships enable row level security;
alter table public.membership_payments enable row level security;

-- tiers: the owning streamer manages their own; anyone may read ACTIVE tiers
-- (the public profile page lists them).
drop policy if exists tiers_select_active on public.membership_tiers;
create policy tiers_select_active on public.membership_tiers
  for select using (active = true);

drop policy if exists tiers_owner_all on public.membership_tiers;
create policy tiers_owner_all on public.membership_tiers
  for all using (auth.uid() = streamer_id) with check (auth.uid() = streamer_id);

grant select on public.membership_tiers to anon, authenticated;
grant insert, update, delete on public.membership_tiers to authenticated;

-- memberships: streamer sees their members; member sees their own. Writes are
-- service-role only (the redeem action verifies the slip first).
drop policy if exists memberships_select_streamer on public.memberships;
create policy memberships_select_streamer on public.memberships
  for select using (auth.uid() = streamer_id);

drop policy if exists memberships_select_member on public.memberships;
create policy memberships_select_member on public.memberships
  for select using (auth.uid() = member_id);

grant select on public.memberships to authenticated;

-- membership_payments: same read split; writes service-role only.
drop policy if exists mpay_select_streamer on public.membership_payments;
create policy mpay_select_streamer on public.membership_payments
  for select using (auth.uid() = streamer_id);

drop policy if exists mpay_select_member on public.membership_payments;
create policy mpay_select_member on public.membership_payments
  for select using (auth.uid() = member_id);

grant select on public.membership_payments to authenticated;

-- ---------------------------------------------------------------------------
-- grant_membership — upsert/extend a membership period. Same tier while still
-- active stacks onto the remaining time; otherwise a fresh period from now.
-- Returns the new period_end. Service-role only (called after slip verify).
-- ---------------------------------------------------------------------------
create or replace function public.grant_membership(
  p_streamer uuid,
  p_member uuid,
  p_member_name text,
  p_tier uuid,
  p_tier_name text,
  p_days int,
  p_amount numeric
)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  cur_tier uuid;
  cur_end timestamptz;
  found_row boolean := false;
  base timestamptz;
  new_end timestamptz;
begin
  select tier_id, period_end into cur_tier, cur_end
  from public.memberships
  where streamer_id = p_streamer and member_id = p_member;
  found_row := found;

  if found_row and cur_tier is not distinct from p_tier and cur_end > now() then
    base := cur_end;          -- renew same tier → stack onto remaining time
  else
    base := now();            -- new member, switched tier, or lapsed → fresh
  end if;
  new_end := base + make_interval(days => p_days);

  insert into public.memberships
    (streamer_id, member_id, member_name, tier_id, tier_name, status,
     period_start, period_end, total_paid)
  values
    (p_streamer, p_member, p_member_name, p_tier, p_tier_name, 'active',
     now(), new_end, p_amount)
  on conflict (streamer_id, member_id) do update
    set tier_id      = excluded.tier_id,
        tier_name    = excluded.tier_name,
        member_name  = excluded.member_name,
        status       = 'active',
        period_end   = new_end,
        period_start = case
                         when public.memberships.period_end > now()
                              and public.memberships.tier_id is not distinct from p_tier
                         then public.memberships.period_start
                         else now()
                       end,
        total_paid   = public.memberships.total_paid + p_amount;

  return new_end;
end;
$$;

revoke all on function public.grant_membership(uuid, uuid, text, uuid, text, int, numeric)
  from public, anon, authenticated;
grant execute on function public.grant_membership(uuid, uuid, text, uuid, text, int, numeric)
  to service_role;

-- ---------------------------------------------------------------------------
-- expire_memberships — flip lapsed memberships to 'expired' (daily cron).
-- ---------------------------------------------------------------------------
create or replace function public.expire_memberships()
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with x as (
    update public.memberships set status = 'expired'
    where status = 'active' and period_end < now()
    returning 1
  )
  select count(*) into n from x;
  return n;
end;
$$;

revoke all on function public.expire_memberships() from public, anon, authenticated;
grant execute on function public.expire_memberships() to service_role;

-- ---------------------------------------------------------------------------
-- Realtime: stream membership changes to the streamer's dashboard.
-- ---------------------------------------------------------------------------
alter table public.memberships replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memberships'
  ) then
    alter publication supabase_realtime add table public.memberships;
  end if;
end $$;
