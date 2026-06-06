import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/constants";
import { daysUntil, formatNumber, formatTHB, timeAgo } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GrantPackageDialog } from "@/components/admin/grant-package-dialog";
import { AdminTestAlertButton } from "@/components/admin/test-alert-button";
import type { Plan } from "@/lib/supabase/types";

export const metadata = { title: "ผู้ใช้ · แอดมิน" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const svc = createAdminClient();
  const { data: users } = await svc.rpc("admin_users", {
    p_search: q ?? "",
    p_limit: 100,
    p_offset: 0,
  });
  const rows = users ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">ผู้ใช้</h1>
        <p className="text-sm text-muted-foreground">
          จัดการสตรีมเมอร์และให้แพ็กเกจ
        </p>
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="ค้นหาชื่อผู้ใช้ / ชื่อที่แสดง"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline">
          ค้นหา
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              ไม่พบผู้ใช้
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map((u) => {
                const plan = effectivePlan(u.plan, u.plan_expires_at);
                const left = daysUntil(u.plan_expires_at);
                return (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">
                          @{u.username ?? "—"}
                        </span>
                        {u.is_admin ? (
                          <Badge
                            variant="outline"
                            className="border-primary/40 text-primary"
                          >
                            ADMIN
                          </Badge>
                        ) : null}
                        <PlanBadge plan={plan} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {u.display_name ?? "—"} ·{" "}
                        {formatNumber(Number(u.donations_count))} โดเนท ·{" "}
                        {formatTHB(Number(u.total_raised))} ·{" "}
                        {formatNumber(Number(u.member_count))} สมาชิก · สมัคร{" "}
                        {timeAgo(u.created_at)}
                        {plan !== "free" && left !== null
                          ? ` · เหลือ ${left} วัน`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminTestAlertButton
                        profileId={u.id}
                        username={u.username ?? ""}
                      />
                      <GrantPackageDialog
                        profileId={u.id}
                        username={u.username ?? ""}
                        currentPlan={plan}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "pro") return <Badge>โปร</Badge>;
  if (plan === "elite")
    return (
      <Badge className="border-transparent bg-amber-500/20 text-amber-400">
        อีลิท
      </Badge>
    );
  return <Badge variant="outline">ฟรี</Badge>;
}
