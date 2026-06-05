"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ? user : null;
}

/** Comp a package to a streamer (no payment). Reuses apply_subscription and
 *  logs a ฿0 method='admin' row for the audit trail. */
export async function adminGrantPackage(input: {
  profileId: string;
  tier: "pro" | "elite";
  days: number;
}): Promise<{ error?: string; ok?: boolean }> {
  if (!(await assertAdmin())) return { error: "ไม่มีสิทธิ์เข้าถึง" };
  if (!["pro", "elite"].includes(input.tier)) {
    return { error: "แพ็กเกจไม่ถูกต้อง" };
  }
  if (!Number.isFinite(input.days) || input.days <= 0 || input.days > 3650) {
    return { error: "จำนวนวันไม่ถูกต้อง" };
  }

  const svc = createAdminClient();
  const { data: newExpiry, error } = await svc.rpc("apply_subscription", {
    p_profile: input.profileId,
    p_tier: input.tier,
    p_days: input.days,
  });
  if (error) return { error: error.message };

  await svc.from("subscription_payments").insert({
    profile_id: input.profileId,
    package_id: `admin-${input.tier}-${input.days}`,
    tier: input.tier,
    days: input.days,
    amount: 0,
    currency: "THB",
    method: "admin",
    status: "paid",
    period_start: new Date().toISOString(),
    period_end: (newExpiry as string) ?? null,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

/** Revoke a streamer back to the free plan. */
export async function adminSetFree(
  profileId: string
): Promise<{ error?: string; ok?: boolean }> {
  if (!(await assertAdmin())) return { error: "ไม่มีสิทธิ์เข้าถึง" };
  const svc = createAdminClient();
  const { error } = await svc
    .from("profiles")
    .update({ plan: "free", plan_expires_at: null })
    .eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
