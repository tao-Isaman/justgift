import { Banknote, CreditCard, Crown, Gift, Users, UserCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumber, formatTHB, timeAgo } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "แอดมิน" };

export default async function AdminOverviewPage() {
  const svc = createAdminClient();

  const [
    { data: ov },
    { data: payments },
    { data: donations },
    { data: memPays },
  ] = await Promise.all([
    svc.rpc("admin_overview"),
    svc
      .from("subscription_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
    svc
      .from("donations")
      .select("*")
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(8),
    svc
      .from("membership_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const o = ov?.[0] ?? {
    streamers: 0,
    onboarded: 0,
    pro_active: 0,
    elite_active: 0,
    donations_count: 0,
    donations_total: 0,
    month_donations_count: 0,
    month_donations_total: 0,
    sub_revenue: 0,
    month_sub_revenue: 0,
    members_count: 0,
    active_members: 0,
    membership_revenue: 0,
    month_membership_revenue: 0,
  };

  const ids = Array.from(
    new Set([
      ...(payments ?? []).map((p) => p.profile_id),
      ...(donations ?? []).map((d) => d.profile_id),
      ...(memPays ?? []).map((m) => m.streamer_id),
    ])
  );
  const { data: profs } = await svc
    .from("profiles")
    .select("id, username")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const nameOf = new Map((profs ?? []).map((p) => [p.id, p.username ?? "—"]));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">ภาพรวมแพลตฟอร์ม</h1>
        <p className="text-sm text-muted-foreground">
          สถิติทั้งระบบ — เฉพาะแอดมินเท่านั้น
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          icon={<Users className="size-5" />}
          label="สตรีมเมอร์ (onboarded / ทั้งหมด)"
          value={`${formatNumber(Number(o.onboarded))} / ${formatNumber(Number(o.streamers))}`}
          sub={`โปร ${formatNumber(Number(o.pro_active))} · อีลิท ${formatNumber(Number(o.elite_active))} (ใช้งานอยู่)`}
        />
        <Stat
          icon={<Gift className="size-5" />}
          label="ยอดโดเนททั้งระบบ"
          value={formatTHB(Number(o.donations_total))}
          sub={`${formatNumber(Number(o.donations_count))} ครั้ง`}
        />
        <Stat
          icon={<CreditCard className="size-5" />}
          label="รายได้ค่าสมาชิก (SaaS)"
          value={formatTHB(Number(o.sub_revenue))}
          sub={`เดือนนี้ ${formatTHB(Number(o.month_sub_revenue))}`}
        />
        <Stat
          icon={<Banknote className="size-5" />}
          label="โดเนทเดือนนี้"
          value={formatTHB(Number(o.month_donations_total))}
          sub={`${formatNumber(Number(o.month_donations_count))} ครั้ง`}
        />
        <Stat
          icon={<UserCheck className="size-5" />}
          label="สมาชิก (ใช้งานอยู่ / ทั้งหมด)"
          value={`${formatNumber(Number(o.active_members))} / ${formatNumber(Number(o.members_count))}`}
          sub="สมาชิกของสตรีมเมอร์ทั้งระบบ"
        />
        <Stat
          icon={<Crown className="size-5" />}
          label="ยอดค่าสมาชิก (ถึงสตรีมเมอร์)"
          value={formatTHB(Number(o.membership_revenue))}
          sub={`เดือนนี้ ${formatTHB(Number(o.month_membership_revenue))}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>การชำระค่าสมาชิก (SaaS) ล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {(payments ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีรายการ
              </p>
            ) : (
              <ul className="divide-y divide-border/60 text-sm">
                {(payments ?? []).map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2.5">
                    <span className="min-w-0 flex-1 truncate">
                      @{nameOf.get(p.profile_id) ?? "—"} ·{" "}
                      {p.tier === "pro" ? "โปร" : "อีลิท"} {p.days} วัน
                    </span>
                    {p.method === "admin" ? (
                      <Badge variant="outline">คอมพ์</Badge>
                    ) : (
                      <span className="font-display font-bold text-primary">
                        {formatTHB(Number(p.amount))}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(p.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สมาชิกใหม่ล่าสุด (ทั้งระบบ)</CardTitle>
          </CardHeader>
          <CardContent>
            {(memPays ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีรายการ
              </p>
            ) : (
              <ul className="divide-y divide-border/60 text-sm">
                {(memPays ?? []).map((m) => (
                  <li key={m.id} className="flex items-center gap-2 py-2.5">
                    <span className="min-w-0 flex-1 truncate">
                      {m.member_name} → @{nameOf.get(m.streamer_id) ?? "—"} ·{" "}
                      {m.tier_name}
                    </span>
                    <span className="font-display font-bold text-primary">
                      {formatTHB(Number(m.amount))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(m.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>โดเนทล่าสุด (ทั้งระบบ)</CardTitle>
        </CardHeader>
        <CardContent>
          {(donations ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              ยังไม่มีรายการ
            </p>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {(donations ?? []).map((d) => (
                <li key={d.id} className="flex items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1 truncate">
                    {d.donor_name} → @{nameOf.get(d.profile_id) ?? "—"}
                  </span>
                  <span className="font-display font-bold text-primary">
                    {formatTHB(Number(d.verified_amount ?? d.amount))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(d.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display truncate text-xl font-bold">{value}</p>
          {sub ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
