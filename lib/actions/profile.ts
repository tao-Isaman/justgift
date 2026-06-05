"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingSchema,
  profileSettingsSchema,
  type OnboardingValues,
  type ProfileSettingsValues,
} from "@/lib/validations";

export async function saveOnboarding(
  raw: OnboardingValues
): Promise<{ error?: string }> {
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };

  const { error } = await supabase
    .from("profiles")
    .update({
      username: v.username,
      display_name: v.displayName,
      receiver_name: v.receiverName,
      promptpay_id: v.promptpayId || null,
      bank_name: v.bankName || null,
      bank_account: v.bankAccount || null,
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProfile(
  raw: ProfileSettingsValues
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = profileSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };

  // Drop empty social entries so the jsonb stays tidy.
  const socials: Record<string, string> = {};
  for (const [k, val] of Object.entries(v.socials)) {
    const t = (val ?? "").trim();
    if (t) socials[k] = t;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: v.displayName,
      bio: v.bio || null,
      banner_url: v.bannerUrl || null,
      accent_color: v.accentColor || null,
      socials,
      suggested_amounts: v.suggestedAmounts,
      show_goal: v.showGoal,
      show_leaderboard: v.showLeaderboard,
      receiver_name: v.receiverName,
      promptpay_id: v.promptpayId || null,
      bank_name: v.bankName || null,
      bank_account: v.bankAccount || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
