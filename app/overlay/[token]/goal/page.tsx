import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/constants";
import { GoalOverlayClient } from "./goal-client";

export const dynamic = "force-dynamic";

export default async function GoalOverlayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, plan, plan_expires_at")
    .eq("overlay_token", token)
    .single();
  if (!profile) return null;
  // Donation goals are an Elite feature.
  if (effectivePlan(profile.plan, profile.plan_expires_at) !== "elite") {
    return null;
  }

  const { data: settings } = await admin
    .from("alert_settings")
    .select("goal_enabled, goal_amount, goal_title, accent_color")
    .eq("profile_id", profile.id)
    .single();

  if (!settings?.goal_enabled || Number(settings.goal_amount) <= 0) return null;

  // Current month total (verified).
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
  const { data: rows } = await admin
    .from("donations")
    .select("verified_amount")
    .eq("profile_id", profile.id)
    .eq("status", "verified")
    .gte("created_at", monthStart);
  const startTotal = (rows ?? []).reduce(
    (sum, r) => sum + Number(r.verified_amount ?? 0),
    0
  );

  return (
    <GoalOverlayClient
      token={token}
      goalAmount={Number(settings.goal_amount)}
      goalTitle={settings.goal_title ?? "เป้าหมายโดเนท"}
      accentColor={settings.accent_color ?? "#dc2626"}
      startTotal={startTotal}
    />
  );
}
