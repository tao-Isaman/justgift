import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatTHB, isFuture } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "การเป็นสมาชิก" };

export default async function MembershipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/memberships");

  const { data: memberships } = await supabase.rpc("my_memberships");
  const list = memberships ?? [];

  return (
    <div className="relative flex min-h-svh flex-col">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-glow" />

      <header className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-5">
        <Logo />
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" })
          )}
        >
          แดชบอร์ด
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-4 pb-16">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            การเป็นสมาชิก
          </h1>
        </div>

        {list.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Crown className="size-6" />
              </span>
              <p className="text-sm text-muted-foreground">
                คุณยังไม่ได้เป็นสมาชิกของสตรีมเมอร์คนไหน
                <br />
                ไปที่เพจของสตรีมเมอร์เพื่อสมัครสมาชิก
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {list.map((m) => {
              const active = isFuture(m.period_end);
              const initials = (m.streamer_display_name ?? "JD")
                .slice(0, 2)
                .toUpperCase();
              return (
                <li key={m.id}>
                  <Card>
                    <CardContent className="flex items-center gap-4">
                      <Avatar className="size-12">
                        <AvatarImage
                          src={m.streamer_avatar_url ?? undefined}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {m.streamer_display_name ??
                              `@${m.streamer_username}`}
                          </span>
                          <Badge
                            className={cn(
                              "border-transparent",
                              active
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {active ? "ใช้งานอยู่" : "หมดอายุ"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          ระดับ {m.tier_name} · จ่ายไปแล้ว{" "}
                          {formatTHB(Number(m.total_paid))}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          {active ? "หมดอายุ" : "หมดอายุเมื่อ"}{" "}
                          {new Date(m.period_end).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Link
                        href={`/${m.streamer_username}`}
                        className={cn(
                          buttonVariants({
                            variant: active ? "outline" : "default",
                            size: "sm",
                          })
                        )}
                      >
                        {active ? "ต่ออายุ" : "สมัครใหม่"}
                      </Link>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
