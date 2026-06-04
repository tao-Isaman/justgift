# JustGift 🎁

Verified donation alerts for Thai streamers. Donors transfer money and upload their
bank slip; JustGift verifies the slip against the bank via
[slip.rdcw.co.th](https://slip.rdcw.co.th) and fires a real-time alert on the
streamer's OBS overlay. Money goes **directly to the streamer** — JustGift never
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

- **SQL Editor** → paste and run `supabase/migrations/0001_init.sql`.
  This creates the tables, RLS policies, the public profile view, the `slips`
  storage bucket, realtime, and the new-user trigger.
- **Authentication → Providers → Email**: for fast local testing you can turn
  **"Confirm email"** off. (With it on, signup shows a "check your email" step and
  the link returns to `/auth/callback`.)

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

## Using the overlay in OBS

1. Sign up → onboarding (claim username + payout account).
2. Dashboard → **Your OBS overlay** → copy the URL.
3. OBS → **Sources → + → Browser** → paste the URL, set 1920×1080.
4. Click **Send test alert** in the dashboard to confirm it works.

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

- Alert customization UI (colors, sounds, GIF, TTS) — schema & overlay already
  support it; the `/dashboard/alerts` screen is a stub.
- Settings screen (edit profile / payout).
- Subscription billing (plan gating is wired in `lib/constants.ts`).
- Donation goals, leaderboards, media share.
- Confirm the exact RDCW response shape against your account and tighten
  `lib/rdcw.ts` types if needed.

---

Built with [Claude Code](https://claude.com/claude-code).
