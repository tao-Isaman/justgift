import { createAdminClient } from "@/lib/supabase/admin";
import { CountdownOverlayClient } from "./countdown-client";

export const dynamic = "force-dynamic";

export default async function CountdownOverlayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("overlay_token", token)
    .single();
  if (!profile) return null;

  const { data: cd } = await admin
    .from("countdowns")
    .select("enabled, running, ends_at, remaining_ms")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!cd?.enabled) return null;

  const { data: settings } = await admin
    .from("alert_settings")
    .select("accent_color")
    .eq("profile_id", profile.id)
    .single();

  return (
    <CountdownOverlayClient
      token={token}
      accentColor={settings?.accent_color ?? "#dc2626"}
      initial={{
        running: cd.running,
        endsAt: cd.ends_at,
        remainingMs: cd.remaining_ms,
      }}
    />
  );
}
