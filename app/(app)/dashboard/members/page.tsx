import { redirect } from "next/navigation";
import { Users, UserCheck, Banknote, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MembersTiers } from "@/components/dashboard/members-tiers";
import { MembersList } from "@/components/dashboard/members-list";
import { formatNumber, formatTHB } from "@/lib/format";

export const metadata = { title: "สมาชิก" };

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = user.id;

  const [{ data: stats }, { data: tiers }, { data: members }] =
    await Promise.all([
      supabase.rpc("my_member_stats"),
      supabase
        .from("membership_tiers")
        .select("*")
        .eq("streamer_id", userId)
        .order("sort", { ascending: true }),
      supabase
        .from("memberships")
        .select("*")
        .eq("streamer_id", userId)
        .order("period_end", { ascending: false })
        .limit(50),
    ]);

  const s = stats?.[0] ?? {
    member_count: 0,
    active_count: 0,
    total_revenue: 0,
    month_revenue: 0,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          สมาชิก
        </h1>
        <p className="text-sm text-muted-foreground">
          ตั้งระดับสมาชิก และดูผู้ที่สมัครเป็นสมาชิกของคุณ
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-5" />}
          label="สมาชิกทั้งหมด"
          value={formatNumber(Number(s.member_count))}
        />
        <StatCard
          icon={<UserCheck className="size-5" />}
          label="ใช้งานอยู่"
          value={formatNumber(Number(s.active_count))}
        />
        <StatCard
          icon={<Banknote className="size-5" />}
          label="รายได้สมาชิกรวม"
          value={formatTHB(Number(s.total_revenue))}
        />
        <StatCard
          icon={<CalendarDays className="size-5" />}
          label="เดือนนี้"
          value={formatTHB(Number(s.month_revenue))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ระดับสมาชิก</CardTitle>
          </CardHeader>
          <CardContent>
            <MembersTiers tiers={tiers ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สมาชิกของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <MembersList streamerId={userId} initial={members ?? []} />
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
