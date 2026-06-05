import type { AlertAnimation, Plan } from "@/lib/supabase/types";

export const SITE = {
  name: "Just Donate",
  tagline: "Slip in. Alert out.",
  description:
    "Verified donation alerts for Thai streamers. Donors transfer and upload a slip — we verify it instantly and fire an on-stream alert.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://justgift.app",
} as const;

/** Thai-first SEO keywords (donation / donation system / PromptPay donation). */
export const SEO_KEYWORDS = [
  "โดเนท",
  "ระบบโดเนท",
  "โดเนทพร้อมเพย์",
  "รับโดเนท",
  "ระบบรับโดเนท",
  "แจ้งเตือนโดเนท",
  "โดเนทสตรีมเมอร์",
  "ระบบโดเนทสตรีมเมอร์",
  "โดเนทเกม",
  "ตรวจสลิปโดเนท",
  "donate",
  "donation alert",
  "streamer donation",
  "PromptPay",
  "Just Donate",
];

/** Thai FAQ — also rendered as FAQPage structured data on the landing page. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Just Donate คือระบบโดเนทแบบไหน",
    a: "Just Donate คือระบบโดเนทสำหรับสตรีมเมอร์ ให้แฟน ๆ โดเนทผ่านพร้อมเพย์หรือโอนผ่านธนาคารแล้วอัปโหลดสลิป ระบบจะตรวจสลิปอัตโนมัติแล้วแจ้งเตือนโดเนทขึ้นจอสตรีมทันที",
  },
  {
    q: "รับโดเนทผ่านพร้อมเพย์ได้ไหม",
    a: "ได้ครับ Just Donate รองรับโดเนทพร้อมเพย์และทุกธนาคารในไทย เงินโดเนทเข้าบัญชีของคุณโดยตรง ไม่ผ่านคนกลาง",
  },
  {
    q: "ระบบโดเนทตรวจสลิปอย่างไร",
    a: "ทุกสลิปจะถูกตรวจสอบกับธนาคารผ่าน slip.rdcw.co.th ว่าจ่ายจริง จ่ายถูกบัญชี และยอดถูกต้อง สลิปปลอมหรือสลิปซ้ำจะถูกปฏิเสธอัตโนมัติ",
  },
  {
    q: "มีค่าธรรมเนียมหักจากยอดโดเนทไหม",
    a: "ไม่มี Just Donate ไม่หักเปอร์เซ็นต์จากยอดโดเนท เงินทั้งหมดเข้าบัญชีคุณโดยตรง เราคิดค่าบริการแบบสมาชิกรายเดือนเท่านั้น",
  },
  {
    q: "ใช้ระบบโดเนทกับ OBS ได้ไหม",
    a: "ได้ เพียงคัดลอก URL overlay จากแดชบอร์ดไปวางเป็น Browser Source ใน OBS ก็แสดงการแจ้งเตือนโดเนทบนสตรีมได้ทันที",
  },
];

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
  "justdonate",
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
    name: "ฟรี",
    price: 0,
    tagline: "ทุกอย่างที่จำเป็นสำหรับเริ่มรับโดเนท",
    features: [
      "โดเนทสูงสุด 20 ครั้ง/เดือน",
      "รับโดเนทที่ตรวจสลิปแล้ว",
      "overlay OBS เรียลไทม์",
      "ประวัติการโดเนท",
      "มีลายน้ำ Just Donate บนการแจ้งเตือน",
    ],
  },
  {
    id: "pro",
    name: "โปร",
    price: 99,
    tagline: "ทำให้การแจ้งเตือนเป็นสไตล์ของคุณ",
    featured: true,
    features: [
      "ทุกอย่างในแพ็กฟรี",
      "โดเนทสูงสุด 120 ครั้ง/เดือน",
      "ปรับสี ฟอนต์ และเสียงแจ้งเตือนเอง",
      "ใส่ภาพ / GIF แจ้งเตือนเอง",
      "อ่านข้อความเป็นเสียงภาษาไทย",
      "ไม่มีลายน้ำ",
      "ตั้งยอดโดเนทขั้นต่ำได้",
    ],
  },
  {
    id: "elite",
    name: "อีลิท",
    price: 199,
    tagline: "สำหรับครีเอเตอร์มืออาชีพ",
    features: [
      "ทุกอย่างในแพ็กโปร",
      "โดเนทไม่จำกัด",
      "เป้าหมายโดเนท + overlay เป้าหมาย",
      "ลีดเดอร์บอร์ดผู้โดเนทสูงสุด",
      "แชร์มีเดีย (คลิป YouTube ขึ้นจอ)",
      "สไตล์แจ้งเตือนหลายแบบ (ตามยอด)",
      "ซัพพอร์ตแบบเร่งด่วน",
    ],
  },
];

export const ALERT_ANIMATIONS: { value: AlertAnimation; label: string }[] = [
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "flip", label: "Flip" },
  { value: "glitch", label: "Glitch" },
];

export const ALERT_FONTS = [
  { value: "Rajdhani", label: "Rajdhani (เกม)" },
  { value: "Orbitron", label: "Orbitron (ดิจิทัล)" },
  { value: "Anuphan", label: "Anuphan (ไทย)" },
  { value: "FCVision", label: "FC Vision (ไทย)" },
] as const;

/** Resolve an alert font choice to a CSS font-family stack (Thai fallback). */
export function fontFamily(font: string | null | undefined): string {
  switch (font) {
    case "Orbitron":
      return "var(--font-orbitron), var(--font-anuphan), sans-serif";
    case "Anuphan":
      return "var(--font-anuphan), sans-serif";
    case "FCVision":
      return '"FC Vision", var(--font-anuphan), sans-serif';
    case "Rajdhani":
    default:
      return "var(--font-rajdhani), var(--font-anuphan), sans-serif";
  }
}

/** Web Speech API voice hints (best-effort; resolved client-side). */
export const TTS_VOICES: { value: string; label: string }[] = [
  { value: "th-TH", label: "ไทย (ค่าเริ่มต้น)" },
  { value: "en-US", label: "อังกฤษ (US)" },
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

/** Max verified donations a streamer can RECEIVE per calendar month, by plan. */
export const PLAN_DONATION_LIMIT: Record<Plan, number> = {
  free: 20,
  pro: 120,
  elite: Infinity,
};

export function donationLimitLabel(plan: Plan): string {
  const n = PLAN_DONATION_LIMIT[plan];
  return Number.isFinite(n) ? `${n} ครั้ง/เดือน` : "ไม่จำกัด";
}

/** Feature gating helper. */
export function planAllows(plan: Plan, required: Plan) {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}

export type PaidPlan = Exclude<Plan, "free">;

/** Prepaid subscription packages (PromptPay one-time, durations). */
export type SubPackage = {
  id: string;
  tier: PaidPlan;
  days: number;
  price: number; // THB
  label: string;
  note?: string;
};

export const PACKAGES: SubPackage[] = [
  { id: "pro-30", tier: "pro", days: 30, price: 99, label: "30 วัน" },
  { id: "pro-90", tier: "pro", days: 90, price: 267, label: "90 วัน", note: "ประหยัด 10%" },
  { id: "pro-365", tier: "pro", days: 365, price: 990, label: "365 วัน", note: "ประหยัด 17%" },
  { id: "elite-30", tier: "elite", days: 30, price: 199, label: "30 วัน" },
  { id: "elite-90", tier: "elite", days: 90, price: 537, label: "90 วัน", note: "ประหยัด 10%" },
  {
    id: "elite-365",
    tier: "elite",
    days: 365,
    price: 1990,
    label: "365 วัน",
    note: "ประหยัด 17%",
  },
];

export function getPackage(id: string): SubPackage | undefined {
  return PACKAGES.find((p) => p.id === id);
}

/** The plan a profile is actually entitled to right now (free once expired). */
export function effectivePlan(plan: Plan, expiresAt: string | null): Plan {
  if (plan === "free") return "free";
  if (expiresAt && new Date(expiresAt).getTime() > Date.now()) return plan;
  return "free";
}
