import { Banknote, CalendarDays, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";
import { formatNumber, formatTHB } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OverlayCard } from "@/components/dashboard/overlay-card";
import { DonationsFeed } from "@/components/dashboard/donations-feed";

export const metadata = { title: "ภาพรวม" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: profile }, { data: stats }, { data: donations }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, overlay_token")
        .eq("id", userId)
        .single(),
      supabase.rpc("my_donation_stats"),
      supabase
        .from("donations")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const s = stats?.[0] ?? { total: 0, donation_count: 0, month_total: 0 };
  const overlayUrl = `${SITE.url}/overlay/${profile?.overlay_token ?? ""}`;
  const pageUrl = `${SITE.url}/${profile?.username ?? ""}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">ภาพรวม</h1>
        <p className="text-sm text-muted-foreground">
          ยินดีต้อนรับกลับ — นี่คือภาพรวมช่องของคุณ
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
