import { createClient } from "@/lib/supabase/server";
import { effectivePlan } from "@/lib/constants";
import { daysUntil } from "@/lib/format";
import { BillingClient } from "./billing-client";

export const metadata = { title: "การเรียกเก็บเงิน" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: profile }, { data: payments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("subscription_payments")
      .select("*")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const plan = profile?.plan ?? "free";
  const planExpiresAt = profile?.plan_expires_at ?? null;
  const active = effectivePlan(plan, planExpiresAt);
  const daysLeft = daysUntil(planExpiresAt);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">การเรียกเก็บเงิน</h1>
        <p className="text-sm text-muted-foreground">
          เลือกแพ็กเกจเพื่อปลดล็อกฟีเจอร์โปร — ชำระผ่านพร้อมเพย์
        </p>
      </div>
      <BillingClient
        active={active}
        daysLeft={daysLeft}
        payments={payments ?? []}
        initialStatus={status ?? null}
      />
    </div>
  );
}
