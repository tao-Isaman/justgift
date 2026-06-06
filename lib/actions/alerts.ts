"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  alertSettingsSchema,
  type AlertSettingsValues,
} from "@/lib/validations";

export async function updateAlertSettings(
  raw: AlertSettingsValues
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = alertSettingsSchema.safeParse(raw);
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
    .from("alert_settings")
    .update({
      animation: v.animation,
      duration_ms: v.durationMs,
      accent_color: v.accentColor,
      text_color: v.textColor,
      font: v.font,
      min_amount: v.minAmount,
      sound_url: v.soundUrl || null,
      sound_volume: v.soundVolume,
      image_url: v.imageUrl || null,
      tts_enabled: v.ttsEnabled,
      tts_voice: v.ttsVoice || null,
      tts_read: v.ttsRead,
      tts_rate: v.ttsRate,
      tts_volume: v.ttsVolume,
      big_threshold: v.bigThreshold,
      big_effect: v.bigEffect,
      member_alert: v.memberAlert,
      goal_enabled: v.goalEnabled,
      goal_amount: v.goalAmount,
      goal_title: v.goalTitle || null,
      goal_period_days: v.goalPeriodDays,
      media_enabled: v.mediaEnabled,
      media_min_amount: v.mediaMinAmount,
      media_max_seconds: v.mediaMaxSeconds,
      variants: v.variants,
    })
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/alerts");
  return { ok: true };
}
