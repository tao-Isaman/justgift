import { createAdminClient } from "@/lib/supabase/admin";
import { OverlayClient } from "./overlay-client";

export const dynamic = "force-dynamic";

export default async function OverlayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, plan")
    .eq("overlay_token", token)
    .single();

  if (!profile) {
    return (
      <div className="fixed inset-0 grid place-items-center">
        <p className="font-mono text-sm text-white/40">Invalid overlay token</p>
      </div>
    );
  }

  const { data: settings } = await admin
    .from("alert_settings")
    .select("*")
    .eq("profile_id", profile.id)
    .single();

  return (
    <OverlayClient
      token={token}
      defaults={{
        accentColor: settings?.accent_color ?? "#dc2626",
        textColor: settings?.text_color ?? "#ffffff",
        imageUrl: settings?.image_url ?? null,
        soundUrl: settings?.sound_url ?? null,
        durationMs: settings?.duration_ms ?? 7000,
        ttsEnabled: settings?.tts_enabled ?? false,
        ttsVoice: settings?.tts_voice ?? null,
        watermark: profile.plan === "free",
      }}
    />
  );
}
