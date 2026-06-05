import Link from "next/link";
import { Banknote, CalendarDays, Gift, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  SITE,
  PLAN_DONATION_LIMIT,
  effectivePlan,
} from "@/lib/constants";
import { formatNumber, formatTHB } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { OverlayCard } from "@/components/dashboard/overlay-card";
import { DonationsFeed } from "@/components/dashboard/donations-feed";
import { cn } from "@/lib/utils";

export const metadata = { title: "ภาพรวม" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: profile }, { data: stats }, { data: donations }, { data: top }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, overlay_token, plan, plan_expires_at")
        .eq("id", userId)
        .single(),
      supabase.rpc("my_donation_stats"),
      supabase
        .from("donations")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.rpc("my_top_donors", { p_limit: 5 }),
    ]);

  const s = stats?.[0] ?? {
    total: 0,
    donation_count: 0,
    month_total: 0,
    month_count: 0,
  };
  const topDonors = top ?? [];

  const overlayUrl = `${SITE.url}/overlay/${profile?.overlay_token ?? ""}`;
  const pageUrl = `${SITE.url}/${profile?.username ?? ""}`;

  const plan = effectivePlan(profile?.plan ?? "free", profile?.plan_expires_at ?? null);
  const limit = PLAN_DONATION_LIMIT[plan];
  const monthCount = Number(s.month_count);
  const finiteLimit = Number.isFinite(limit);
  const usagePct = finiteLimit ? Math.min(100, (monthCount / limit) * 100) : 0;
  const atLimit = finiteLimit && monthCount >= limit;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">ภาพรวม</h1>
        <p className="text-sm text-muted-foreground">
          ยินดีต้อนรับกลับ — นี่คือภาพรวมช่องของคุณ
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          icon={<Banknote className="size-5" />}
          label="ยอดโดเนทรวม"
          value={formatTHB(Number(s.total))}
        />
        <StatCard
          icon={<Gift className="size-5" />}
          label="จำนวนโดเนท"
          value={formatNumber(Number(s.donation_count))}
        />
        <StatCard
          icon={<CalendarDays className="size-5" />}
          label="เดือนนี้"
          value={formatTHB(Number(s.month_total))}
        />
      </div>

      {/* Monthly usage */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                โดเนทที่รับได้เดือนนี้ (แพ็ก{plan})
              </p>
              <p className="font-display text-xl font-bold">
                {formatNumber(monthCount)} /{" "}
                {finiteLimit ? formatNumber(limit) : "ไม่จำกัด"}
              </p>
            </div>
            {finiteLimit ? (
              <Link
                href="/dashboard/billing"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                อัปเกรด
              </Link>
            ) : (
              <Badge variant="outline" className="border-primary/40 text-primary">
                ไม่จำกัด
              </Badge>
            )}
          </div>
          {finiteLimit ? (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width]",
                  atLimit ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          ) : null}
          {atLimit ? (
            <p className="text-xs text-destructive">
              รับโดเนทครบโควต้าเดือนนี้แล้ว — อัปเกรดเพื่อรับเพิ่ม
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <OverlayCard overlayUrl={overlayUrl} pageUrl={pageUrl} />
        <Card>
          <CardHeader>
            <CardTitle>โดเนทล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <DonationsFeed profileId={userId} initial={donations ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-4 text-primary" /> ผู้โดเนทสูงสุดเดือนนี้
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topDonors.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลเดือนนี้
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {topDonors.map((d, i) => (
                <li
                  key={`${d.donor_name}-${i}`}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="font-display grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {d.donor_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(Number(d.donations))} ครั้ง
                  </span>
                  <span className="font-display font-bold text-primary tabular-nums">
                    {formatTHB(Number(d.total))}
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display truncate text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
