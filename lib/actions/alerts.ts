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
      position: v.position,
      duration_ms: v.durationMs,
      accent_color: v.accentColor,
      text_color: v.textColor,
      min_amount: v.minAmount,
      sound_url: v.soundUrl || null,
      sound_volume: v.soundVolume,
      image_url: v.imageUrl || null,
      tts_enabled: v.ttsEnabled,
      tts_voice: v.ttsVoice || null,
      tts_rate: v.ttsRate,
      tts_volume: v.ttsVolume,
      big_threshold: v.bigThreshold,
      big_effect: v.bigEffect,
    })
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/alerts");
  return { ok: true };
}
