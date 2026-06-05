import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/constants";
import { LeaderboardOverlayClient } from "./leaderboard-client";

export const dynamic = "force-dynamic";

export default async function LeaderboardOverlayPage({
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
  // Leaderboard is an Elite feature.
  if (effectivePlan(profile.plan, profile.plan_expires_at) !== "elite") {
    return null;
  }

  const { data: settings } = await admin
    .from("alert_settings")
    .select("accent_color")
    .eq("profile_id", profile.id)
    .single();

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
  const { data: rows } = await admin
    .from("donations")
    .select("donor_name, verified_amount")
    .eq("profile_id", profile.id)
    .eq("status", "verified")
    .gte("created_at", monthStart);

  const totals = new Map<string, number>();
  for (const r of rows ?? []) {
    const name = r.donor_name ?? "—";
    totals.set(name, (totals.get(name) ?? 0) + Number(r.verified_amount ?? 0));
  }
  const startEntries = Array.from(totals, ([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <LeaderboardOverlayClient
      token={token}
      accentColor={settings?.accent_color ?? "#dc2626"}
      startEntries={startEntries}
    />
  );
}
