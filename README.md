# Just Donate 🎁

Verified donation alerts for Thai streamers. Donors transfer money and upload their
bank slip; Just Donate verifies the slip against the bank via
[slip.rdcw.co.th](https://slip.rdcw.co.th) and fires a real-time alert on the
streamer's OBS overlay. Money goes **directly to the streamer** — Just Donate never
holds funds.

> Black / red esport theme · Next.js 16 · TypeScript · Bun · shadcn (Base UI) · Supabase

---

## How it works

```
Donor opens justgift.app/<username>
  → enters name + message + amount
  → transfers to the streamer's PromptPay / bank
  → uploads the transfer slip
        │  (QR decoded in the browser with jsQR)
        ▼  server action → RDCW /v2/inquiry  (real payment? right account? right amount?)
        ▼  anti-fraud: unique slip_trans_ref (no reuse) · receiver match · min amount · freshness
        ▼  insert donation (verified_amount from the slip = source of truth)
        ▼  Supabase Realtime Broadcast → channel overlay:<token>
  → OBS browser source animates the alert + sound + Thai TTS
```

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**, package manager **Bun**
- **Supabase** — Postgres, Auth, Row Level Security, Realtime, Storage
- **shadcn/ui** (the new Base UI `base-nova` style) + **Tailwind CSS v4**
- **jsQR** slip decoding · **motion** animations · **react-hook-form** + **zod**

## Project structure

```
app/
  page.tsx                  Landing (marketing)
  (auth)/login, /signup     Auth screens
  auth/callback/route.ts    Email-confirmation code exchange
  onboarding/               Claim username + payout details
  (app)/dashboard/          Streamer dashboard (overview, alerts, settings, billing)
  [username]/               Public donation page + slip upload
  overlay/[token]/          OBS browser source (transparent, realtime)
components/
  alert-card.tsx            The donation alert visual (shared everywhere)
  dashboard/                Dashboard UI
  ui/                       shadcn components
lib/
  supabase/                 client / server / admin / proxy helpers + types
  actions/                  server actions (auth, profile, donate, overlay)
  rdcw.ts                   RDCW slip verification client
  qr.ts                     client-side slip QR decoder
supabase/migrations/        SQL schema, RLS, triggers, storage, realtime
proxy.ts                    session refresh + route protection (Next 16 "proxy")
```

## Setup

### 1. Install

```bash
bun install
```

### 2. Create a Supabase project

In the [Supabase dashboard](https://supabase.com/dashboard), create a project, then:

- **SQL Editor** → run the migrations in `supabase/migrations/` in order:
  `0001_init.sql` (tables, RLS, public profile view, `slips` bucket, realtime,
  new-user trigger), `0002_overlay.sql` (overlay alert-settings columns), then
  `0003_subscriptions.sql` (plan expiry + subscription payments), then
  `0004_goals_stats.sql` (donation goals + dashboard stats/leaderboard), then
  `0005_media_variants.sql` (media share + amount-tier variants), then
  `0006_admin.sql` (admin portal). All are idempotent and safe to re-run.
- **Authentication → Providers → Email**: for fast local testing you can turn
  **"Confirm email"** off. (With it on, signup shows a "check your email" step and
  the link returns to `/auth/callback`.)
- **Authentication → Providers → Google**: enable it and paste your Google OAuth
  **Client ID / Secret** from Google Cloud Console (Credentials → OAuth client,
  authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`).
- **Authentication → URL Configuration**: set the Site URL, and add
  `http://localhost:3000/auth/callback` (plus your production URL) to **Redirect
  URLs** so the "Continue with Google" flow can return.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Project Settings → API (anon public)
SUPABASE_SERVICE_ROLE_KEY=       # Project Settings → API (service_role — server only)
NEXT_PUBLIC_APP_URL=http://localhost:3000
RDCW_CLIENT_ID=                  # https://slip.rdcw.co.th account
RDCW_CLIENT_SECRET=
```

> The repo ships with placeholder values in `.env.local` so the app boots; replace
> them to enable auth, verification and alerts.

### 4. Run

```bash
bun run dev      # http://localhost:3000
bun run build    # production build
bun run lint     # eslint
```

## Overlay features

The OBS overlay (`/overlay/<token>`) supports:

- **Animations**: slide / zoom / flip (3D) / glitch
- **Position**: top-left / top-center / top-right / center
- **Sound**: a custom sound URL + volume, or a built-in synthesized chime
- **Thai TTS** with voice, rate and volume
- **Big-donation hype**: donations ≥ a threshold get a larger card + confetti
- **Custom font** (Pro): Rajdhani / Orbitron / Anuphan / FC Vision
- **Donation goal bar** (Elite): a separate browser source at
  `/overlay/<token>/goal` that fills live as donations come in
- **Leaderboard** (Elite): a top-donors browser source at
  `/overlay/<token>/leaderboard` that re-ranks live as donations arrive
- **Media share** (Elite): donors attach a YouTube link (amount-gated + max
  length); it plays after the alert and can be skipped from the dashboard
- **Amount-tier variants** (Elite): different accent / image / animation per
  donation size (highest tier ≤ the amount wins)
- **Queue** so alerts never overlap, and a free-plan watermark

All of it is configured at **`/dashboard/alerts`** with a live preview, "play
preview", and "send test to overlay" (incl. a big-donation test).

## Using the overlay in OBS

1. Sign up → onboarding (claim username + payout account).
2. Dashboard → **Your OBS overlay** → copy the URL.
3. OBS → **Sources → + → Browser** → paste the URL, set 1920×1080.
4. Click **Send test alert** in the dashboard to confirm it works.

## Subscriptions (packages)

Streamers buy **Pro/Elite** as **prepaid durations** (30/90/365 days) and pay by
**PromptPay via Stripe Checkout** (one-time — PromptPay can't auto-renew). Flow:
`/dashboard/billing` → pick a package → `createCheckout` → Stripe hosted page →
PromptPay QR → webhook `checkout.session.completed` → `apply_subscription` stacks
`plan_expires_at`. `effectivePlan()` treats an expired plan as free immediately,
and a daily Vercel cron (`/api/cron/expire`, see `vercel.json`) downgrades lapsed
rows.

Setup:
1. Stripe (Thailand account) → enable **PromptPay** under Settings → Payment methods.
2. Developers → Webhooks → add `https://<your-domain>/api/stripe/webhook`, events
   `checkout.session.completed` + `checkout.session.async_payment_succeeded`, and
   copy the signing secret.
3. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, and ensure
   `NEXT_PUBLIC_APP_URL` is your real URL (used for return links).
4. Local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

**Monthly receive caps** (enforced in `submitDonation`, shown on the dashboard):
Free **20** / Pro **120** / Elite **unlimited** verified donations per month.

## Admin portal

A hidden portal at **`/admin`** + **`/admin/users`**, gated server-side by
`profiles.is_admin` (non-admins get a 404). Make yourself an admin once:

```sql
update public.profiles set is_admin = true where username = 'yourname';
```

It surfaces platform stats (streamers, active Pro/Elite, donation volume,
subscription revenue, recent payments/donations) and a searchable user list
where you can **grant a package for free** (a ฿0 `method='admin'` comp that
reuses `apply_subscription`) or revoke a streamer to Free. Admin reads use the
service-role client after verifying the caller, so RLS isn't in the way.

## Memberships

Viewers can become **members** of a streamer — same **verify-only** model as
donations (the money goes straight to the streamer, no custody). Streamers define
their own **tiers** (name, price, duration, perks, colour) under
**`/dashboard/members`**; viewers sign in with Google, transfer the tier price to
the streamer's PromptPay/bank, and upload a slip. RDCW verifies it (right account,
amount ≥ tier price, fresh, not reused across donations *or* memberships) and
`grant_membership` opens/extends the period (same-tier renewals stack). Because
PromptPay can't auto-renew, memberships are **prepaid periods** the member re-buys
from their **`/memberships`** page. Streamers see their members live; admins see
platform-wide member counts + revenue. An optional on-stream "new member" alert
reuses the overlay broadcast.

The public page (`/[username]`) is also customizable from **`/dashboard/settings`**:
banner, theme colour, bio, social links, quick-donate amounts, and goal/leaderboard
visibility.

## Security & anti-fraud

- **Verify-only money flow** — donors pay the streamer directly; the platform never
  custodies funds (no e-money license needed).
- **Slip = source of truth** — the on-stream amount is the bank-verified amount, not
  whatever the donor typed.
- **No slip reuse** — `donations.slip_trans_ref` is `UNIQUE`.
- **Receiver match** — the slip's masked receiver is matched to the streamer's
  account tail / name tokens; mismatches are rejected.
- **All donation writes go through the service role** (server actions), never the
  client, so verification can't be bypassed. Public reads use a column-limited
  `public_profiles` view that never exposes the secret `overlay_token`.
- The overlay is unauthenticated by design (OBS just loads a URL); it receives
  alerts over a **Broadcast** channel keyed by the secret token.

## Roadmap

- Banner/avatar uploads (today the banner is a pasted image URL, like alert images).
- Per-tier member perks enforcement (badges in alerts/leaderboard, member-only media).
- Confirm the exact RDCW response shape against your account and tighten
  `lib/rdcw.ts` types if needed.

---

Built with [Claude Code](https://claude.com/claude-code).
