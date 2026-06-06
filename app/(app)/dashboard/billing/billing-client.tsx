"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCheckout } from "@/lib/actions/billing";
import { PACKAGES, PLANS } from "@/lib/constants";
import { formatTHB, timeAgo } from "@/lib/format";
import type { Plan, SubscriptionPayment } from "@/lib/supabase/types";

const PLAN_LABEL: Record<Plan, string> = {
  free: "ฟรี",
  pro: "โปร",
  elite: "อีลิท",
};

const TIERS: { tier: "pro" | "elite"; popular?: boolean }[] = [
  { tier: "elite" },
];

export function BillingClient({
  active,
  daysLeft,
  payments,
  initialStatus,
}: {
  active: Plan;
  daysLeft: number | null;
  payments: SubscriptionPayment[];
  initialStatus: string | null;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (initialStatus === "success") {
      toast.success("ชำระเงินสำเร็จ! แพ็กเกจของคุณกำลังเปิดใช้งาน");
    } else if (initialStatus === "cancel") {
      toast.message("ยกเลิกการชำระเงินแล้ว");
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buy(packageId: string) {
    setPendingId(packageId);
    startTransition(async () => {
      const res = await createCheckout(packageId);
      if (res.error) {
        toast.error(res.error);
        setPendingId(null);
        return;
      }
      if (res.url) window.location.href = res.url;
    });
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">แพ็กเกจปัจจุบัน</p>
            <p className="font-display text-xl font-bold">
              {PLAN_LABEL[active]}
            </p>
          </div>
          {active !== "free" && daysLeft !== null ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              เหลือ {daysLeft} วัน
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      {/* Packages */}
      {TIERS.map(({ tier, popular }) => {
        const features = PLANS.find((p) => p.id === tier)?.features ?? [];
        const pkgs = PACKAGES.filter((p) => p.tier === tier);
        return (
          <Card key={tier}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-bold">
                  {PLAN_LABEL[tier]}
                </h3>
                {popular ? <Badge>ยอดนิยม</Badge> : null}
                {active === tier ? (
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary"
                  >
                    กำลังใช้งาน
                  </Badge>
                ) : null}
              </div>

              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="grid gap-3 sm:grid-cols-3">
                {pkgs.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex flex-col items-center rounded-lg border border-border/60 p-4 text-center"
                  >
                    <p className="text-sm text-muted-foreground">{pkg.label}</p>
                    <p className="font-display text-2xl font-extrabold">
                      {formatTHB(pkg.price)}
                    </p>
                    <p className="h-4 text-xs text-primary">{pkg.note ?? ""}</p>
                    <Button
                      className="mt-3 w-full"
                      disabled={pendingId !== null}
                      onClick={() => buy(pkg.id)}
                    >
                      {pendingId === pkg.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      ซื้อ
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* History */}
      <Card>
        <CardContent className="space-y-3">
          <h3 className="font-heading text-base font-semibold">
            ประวัติการชำระเงิน
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีประวัติการชำระเงิน
            </p>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="font-medium">
                    {PLAN_LABEL[p.tier]} · {p.days} วัน
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(p.created_at)}
                  </span>
                  <span className="font-display font-bold text-primary">
                    {formatTHB(Number(p.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            ชำระผ่านพร้อมเพย์ด้วย Stripe · ไม่มีการต่ออายุอัตโนมัติ
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
