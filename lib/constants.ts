import type { AlertAnimation, Plan } from "@/lib/supabase/types";

export const SITE = {
  name: "JustGift",
  tagline: "Slip in. Alert out.",
  description:
    "Verified donation alerts for Thai streamers. Donors transfer and upload a slip — we verify it instantly and fire an on-stream alert.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://justgift.app",
} as const;

/** Usernames that can't be claimed because they collide with app routes. */
export const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "dashboard",
  "onboarding",
  "overlay",
  "api",
  "auth",
  "settings",
  "alerts",
  "billing",
  "admin",
  "about",
  "pricing",
  "terms",
  "privacy",
  "support",
  "help",
  "justgift",
  "www",
]);

export type PlanDef = {
  id: Plan;
  name: string;
  price: number; // THB / month
  tagline: string;
  featured?: boolean;
  features: string[];
};

export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Rookie",
    price: 0,
    tagline: "Everything you need to start taking donations.",
    features: [
      "Verified slip donations",
      "Real-time OBS overlay",
      "1 alert style",
      "Donation history",
      "JustGift watermark on alerts",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    tagline: "Make your alerts yours.",
    featured: true,
    features: [
      "Everything in Rookie",
      "Custom alert colors, fonts & sounds",
      "Custom alert image / GIF",
      "Thai text-to-speech",
      "No watermark",
      "Minimum donation amount",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 199,
    tagline: "For full-time creators.",
    features: [
      "Everything in Pro",
      "Donation goals & leaderboards",
      "Media share (clips on stream)",
      "Multiple alert variants",
      "Priority support",
    ],
  },
];

export const ALERT_ANIMATIONS: { value: AlertAnimation; label: string }[] = [
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "flip", label: "Flip" },
  { value: "glitch", label: "Glitch" },
];

/** Web Speech API voice hints (best-effort; resolved client-side). */
export const TTS_VOICES: { value: string; label: string }[] = [
  { value: "th-TH", label: "Thai (default)" },
  { value: "en-US", label: "English (US)" },
];

/** Major Thai banks + wallets for the payout account selector. */
export const THAI_BANKS: { value: string; label: string }[] = [
  { value: "PromptPay", label: "PromptPay" },
  { value: "KBANK", label: "Kasikornbank (KBank)" },
  { value: "SCB", label: "Siam Commercial Bank (SCB)" },
  { value: "BBL", label: "Bangkok Bank (BBL)" },
  { value: "KTB", label: "Krungthai Bank (KTB)" },
  { value: "BAY", label: "Krungsri (BAY)" },
  { value: "TTB", label: "TMBThanachart (ttb)" },
  { value: "GSB", label: "Government Savings Bank (GSB)" },
  { value: "TrueMoney", label: "TrueMoney Wallet" },
];

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, elite: 2 };

/** Feature gating helper. */
export function planAllows(plan: Plan, required: Plan) {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}
