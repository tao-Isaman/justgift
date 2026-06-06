import { z } from "zod";
import { RESERVED_USERNAMES } from "@/lib/constants";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "3–20 ตัวอักษร: a–z, 0–9 และขีดล่าง (_)")
  .refine((u) => !RESERVED_USERNAMES.has(u), "ชื่อผู้ใช้นี้ถูกสงวนไว้");

export const onboardingSchema = z
  .object({
    username: usernameSchema,
    displayName: z.string().trim().min(2, "อย่างน้อย 2 ตัวอักษร").max(40),
    receiverName: z
      .string()
      .trim()
      .min(2, "กรอกชื่อบนบัญชีของคุณ")
      .max(80),
    promptpayId: z.string().trim().max(40).optional().or(z.literal("")),
    bankName: z.string().trim().max(40).optional().or(z.literal("")),
    bankAccount: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine((v) => !!v.promptpayId || (!!v.bankName && !!v.bankAccount), {
    message: "เพิ่มพร้อมเพย์ หรือธนาคารพร้อมเลขที่บัญชี",
    path: ["promptpayId"],
  });

export type OnboardingValues = z.infer<typeof onboardingSchema>;

/** Donor-facing donation form. */
export const donationSchema = z.object({
  donorName: z.string().trim().min(1, "กรอกชื่อ").max(40),
  message: z.string().trim().max(200, "ไม่เกิน 200 ตัวอักษร").optional(),
  amount: z.coerce
    .number()
    .positive("กรอกจำนวนเงิน")
    .max(1_000_000, "จำนวนเงินมากเกินไป"),
});

export type DonationValues = z.infer<typeof donationSchema>;

const httpUrlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "ลิงก์ไม่ถูกต้อง");

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "สีไม่ถูกต้อง");

export const alertSettingsSchema = z.object({
  animation: z.enum(["slide", "zoom", "flip", "glitch"]),
  durationMs: z.number().min(1000).max(30000),
  accentColor: hexColor,
  textColor: hexColor,
  font: z.enum(["Rajdhani", "Orbitron", "Anuphan", "FCVision"]),
  minAmount: z.number().min(0).max(1_000_000),
  soundUrl: httpUrlOrEmpty,
  soundVolume: z.number().min(0).max(1),
  imageUrl: httpUrlOrEmpty,
  ttsEnabled: z.boolean(),
  ttsVoice: z.string().max(20),
  ttsRead: z.enum(["all", "message"]),
  ttsRate: z.number().min(0.5).max(2),
  ttsVolume: z.number().min(0).max(1),
  bigThreshold: z.number().min(0).max(1_000_000),
  bigEffect: z.boolean(),
  memberAlert: z.boolean(),
  goalEnabled: z.boolean(),
  goalTitle: z.string().trim().max(60),
  goalAmount: z.number().min(0).max(100_000_000),
  goalPeriodDays: z.number().int().min(0).max(3650),
  mediaEnabled: z.boolean(),
  mediaMinAmount: z.number().min(0).max(1_000_000),
  mediaMaxSeconds: z.number().min(5).max(120),
  variants: z
    .array(
      z.object({
        minAmount: z.number().min(1).max(1_000_000),
        accentColor: hexColor,
        imageUrl: httpUrlOrEmpty,
        animation: z.enum(["slide", "zoom", "flip", "glitch"]),
      })
    )
    .max(5),
});

export type AlertSettingsValues = z.infer<typeof alertSettingsSchema>;

/** Streamer profile + public-page customization (dashboard settings). */
export const profileSettingsSchema = z
  .object({
    displayName: z.string().trim().min(2, "อย่างน้อย 2 ตัวอักษร").max(40),
    bio: z.string().trim().max(300, "ไม่เกิน 300 ตัวอักษร"),
    avatarUrl: httpUrlOrEmpty,
    bannerUrl: httpUrlOrEmpty,
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "สีไม่ถูกต้อง")
      .or(z.literal("")),
    socials: z.object({
      instagram: z.string().trim().max(200),
      x: z.string().trim().max(200),
      youtube: z.string().trim().max(200),
      tiktok: z.string().trim().max(200),
      discord: z.string().trim().max(200),
      website: z.string().trim().max(200),
    }),
    suggestedAmounts: z
      .array(z.number().int().positive().max(1_000_000))
      .max(6, "ไม่เกิน 6 จำนวน"),
    showGoal: z.boolean(),
    showLeaderboard: z.boolean(),
    receiverName: z.string().trim().min(2, "กรอกชื่อบนบัญชีของคุณ").max(80),
    promptpayId: z.string().trim().max(40),
    bankName: z.string().trim().max(40),
    bankAccount: z.string().trim().max(40),
  })
  .refine((v) => !!v.promptpayId || (!!v.bankName && !!v.bankAccount), {
    message: "เพิ่มพร้อมเพย์ หรือธนาคารพร้อมเลขที่บัญชี",
    path: ["promptpayId"],
  });

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;

/** Streamer-defined membership tier (dashboard). */
export const membershipTierSchema = z.object({
  name: z.string().trim().min(2, "ตั้งชื่อระดับ").max(40),
  price: z.number().positive("กรอกราคา").max(1_000_000),
  days: z.number().int().min(1).max(3650),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "สีไม่ถูกต้อง"),
  perks: z.array(z.string().trim().max(80)).max(8),
});

export type MembershipTierValues = z.infer<typeof membershipTierSchema>;
