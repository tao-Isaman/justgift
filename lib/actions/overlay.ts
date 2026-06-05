"use server";

import { createClient } from "@/lib/supabase/server";
import { broadcastToOverlay, broadcastSkip } from "@/lib/supabase/broadcast";

export async function sendTestAlert(input?: {
  amount?: number;
  donorName?: string;
  message?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("overlay_token")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "ไม่พบโปรไฟล์" };

  const { data: settings } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  try {
    await broadcastToOverlay(profile.overlay_token, {
      id: crypto.randomUUID(),
      donorName: input?.donorName?.trim() || "ผู้ทดสอบ",
      amount: input?.amount && input.amount > 0 ? input.amount : 99,
      message:
        input?.message?.trim() ||
        "🎉 นี่คือการแจ้งเตือนทดสอบจากแดชบอร์ดของคุณ!",
      accentColor: settings?.accent_color,
      textColor: settings?.text_color,
      imageUrl: settings?.image_url,
      durationMs: settings?.duration_ms,
      ttsEnabled: settings?.tts_enabled,
      ttsVoice: settings?.tts_voice,
      animation: settings?.animation,
      test: true,
    });
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "ส่งการแจ้งเตือนไม่สำเร็จ",
    };
  }
}

export async function skipOverlayMedia(): Promise<{
  error?: string;
  ok?: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("overlay_token")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "ไม่พบโปรไฟล์" };

  try {
    await broadcastSkip(profile.overlay_token);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ข้ามมีเดียไม่สำเร็จ" };
  }
}

