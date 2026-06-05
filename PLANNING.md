# Just Donate — Project Plan

> Donation alert platform for Thai streamers. Donors transfer money + upload a slip;
> we verify the slip and fire a real-time alert on the streamer's stream overlay.
> Inspired by easydonate.app.

## 1. Product decisions (locked)

| Decision | Choice | Consequence |
|---|---|---|
| Money flow | **Verify-only** — donor pays streamer directly | No money custody, no e-money license, no payout system |
| Monetization | **Subscription SaaS** | Plan gating on features; schema stays billing-agnostic for now |
| Pay rail (MVP) | **Any bank transfer + slip upload** | RDCW must match receiver + amount; fuzzy name matching needed |
| Slip verification | **slip.rdcw.co.th** (RDCW inquiry API) | Paid per-call quota → must dedupe + rate-limit |

## 2. Tech stack

- **Runtime / pkg mgr:** Bun
- **Framework:** Next.js (App Router) + TypeScript
- **UI:** shadcn/ui + Tailwind, custom **black/red esport** theme
- **Backend / DB / Auth / Realtime / Storage:** Supabase
- **Slip QR decode:** `jsqr` (or `@zxing/library`) — client-side decode, server-side re-verify
- **Realtime alert transport:** Supabase Realtime **Broadcast** channel (unauth overlay friendly)
- **Hosting:** Vercel

## 3. Core flows

### A. Donation + verification (the critical path)
```
Donor opens justgift.app/[username]
  → enters display name + message + amount
  → transfers money to streamer (their bank/PromptPay shown on page)
  → uploads slip image
        │
        ▼ (client) decode QR/EMV payload from slip image (jsqr)
        ▼ (server action) POST payload → RDCW inquiry API (Basic auth)
        ▼ validate:
            - receiver matches streamer's registered account/name (fuzzy)
            - amount > min, currency THB
            - transRef NOT seen before  (UNIQUE constraint = anti-replay)
            - transDate recent (within N hours)
        ▼ insert donation (status = verified, verified_amount from slip)
        ▼ broadcast → channel `overlay:<token>`  (service role)
  → donor sees "Thank you" screen
```

### B. Stream overlay (OBS browser source)
```
Streamer adds browser source: justgift.app/overlay/<secret-token>
  → page subscribes to Supabase Realtime channel `overlay:<token>`
  → on 'donation' event: animate alert card + play sound + (TTS message)
  → queue alerts so they don't overlap
```

## 4. Data model (Supabase / Postgres)

```
profiles
  id            uuid PK  → auth.users.id
  username      text unique           (used in public URL)
  display_name  text
  avatar_url    text
  bio           text
  receiver_name text                  (for RDCW receiver matching)
  promptpay_id  text                  (shown to donors)
  bank_account  text                  (masked, shown to donors)
  overlay_token text unique           (secret, in OBS URL)
  plan          text default 'free'   (free | pro | elite)
  created_at    timestamptz

alert_settings
  profile_id    uuid PK → profiles.id
  min_amount    numeric default 1
  duration_ms   int default 7000
  sound_url     text
  image_url     text                  (gif/apng for alert)
  animation     text default 'slide'
  accent_color  text default '#dc2626'
  text_color    text default '#ffffff'
  font          text
  tts_enabled   bool default false
  tts_voice     text

donations
  id             uuid PK
  profile_id     uuid → profiles.id
  donor_name     text                 (display only, donor-typed)
  message        text
  amount         numeric              (donor-claimed; display)
  verified_amount numeric             (from slip = source of truth)
  currency       text default 'THB'
  status         text                 (pending | verified | rejected | shown)
  slip_trans_ref text UNIQUE          (anti-replay)
  sender_name    text                 (from slip)
  sender_bank    text
  slip_data      jsonb                (full RDCW response, audit)
  reject_reason  text
  created_at     timestamptz
  shown_at       timestamptz

-- subscriptions (Phase 6, billing)
```

### RLS sketch
- `profiles`: public read of (username, display_name, avatar_url, bio, promptpay_id, bank_account) via a safe **view**; owner read/write all.
- `donations`: **no public insert** — all writes go through a server action using the service role (so verification can't be bypassed). Owner can read their own.
- Overlay is **unauthenticated** → uses Realtime **Broadcast** (server publishes with service role); no RLS dependency.

## 5. Anti-fraud (verify-only model is the risk surface)

1. **Replay** — `slip_trans_ref` UNIQUE → a slip can be used once.
2. **Amount spoof** — display uses `verified_amount` from the slip, not donor's claim.
3. **Wrong receiver** — RDCW returns receiver; fuzzy-match against `receiver_name`/account (Thai banks mask names → partial match + account tail).
4. **Stale slip** — reject if `transDate` older than N hours.
5. **Quota abuse** — require image upload first; rate-limit per IP/streamer; cache by transRef.
6. **NSFW message/name** — basic Thai+EN profanity filter before broadcast; streamer can blocklist.

## 6. Theme — black/red esport

- Base: near-black (`zinc-950 #0a0a0a`), surfaces `zinc-900`.
- Accent: red-600 `#dc2626`, with neon glow (`box-shadow` + `drop-shadow`).
- Geometry: sharp corners, angular clip-paths, thin red borders.
- Type: display font (Orbitron / Rajdhani / "Anuphan" for Thai) + Inter body.
- Motion: framer-motion for alert slam-in, scanline/grid backgrounds.

## 7. Routes

```
/                       landing (marketing)
/(auth)/login, /signup  auth
/dashboard              donations feed + overlay URL + stats
/dashboard/settings     profile, bank/promptpay, account
/dashboard/alerts       alert customization (live preview)
/dashboard/billing      subscription (Phase 6)
/[username]             public donation page  (transfer info + slip upload)
/overlay/[token]        OBS browser source  (Realtime, no chrome)
```

## 8. Build phases

- **P0 — Scaffold:** Bun + Next + TS + Tailwind + shadcn, theme tokens, Supabase client, landing page.
- **P1 — Auth & profile:** signup/login, profile + onboarding (username, bank/promptpay), overlay token, dashboard shell.
- **P2 — Donation + verify:** public `/[username]`, slip upload, QR decode, RDCW integration, donations table + RLS, anti-fraud rules.
- **P3 — Overlay:** `/overlay/[token]`, Realtime broadcast, alert animation + sound + queue.
- **P4 — Alert customization:** `/dashboard/alerts` with live preview, plan gating.
- **P5 — Extras:** TTS (Thai), donation goals, media-share, leaderboards.
- **P6 — Billing:** subscription gateway, plan enforcement.
- **P7 — Hardening:** fraud, analytics, rate limits, polish.

## 9. Open items to confirm during build

- RDCW exact endpoint/auth/response shape (verify against their docs when wiring P2).
- TTS provider for Thai (Web Speech in OBS CEF is unreliable → likely server-side TTS).
- Subscription payment gateway for Thailand (Stripe TH vs Omise vs 2C2P).
