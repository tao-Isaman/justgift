"use server";

import { createClient } from "@/lib/supabase/server";
import { broadcastToOverlay } from "@/lib/supabase/broadcast";

export async function sendTestAlert(): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("overlay_token")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };

  const { data: settings } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  try {
    await broadcastToOverlay(profile.overlay_token, {
      id: crypto.randomUUID(),
      donorName: "Test Donor",
      amount: 99,
      message: "🎉 This is a test alert from your dashboard!",
      accentColor: settings?.accent_color,
      textColor: settings?.text_color,
      imageUrl: settings?.image_url,
      durationMs: settings?.duration_ms,
      ttsEnabled: settings?.tts_enabled,
      ttsVoice: settings?.tts_voice,
      test: true,
    });
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to send alert" };
  }
}
