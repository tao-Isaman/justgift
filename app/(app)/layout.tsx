import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, onboarded")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect("/onboarding");

  const initials = (profile.display_name ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar p-4 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-6 flex-1">
          <DashboardNav />
        </div>
        <div className="space-y-3 border-t border-border/60 pt-4">
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="flex items-center gap-2 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-4" /> ดูเพจของฉัน
          </Link>
          <div className="flex items-center gap-2 px-1">
            <Avatar className="size-8">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {profile.display_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                @{profile.username}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <Logo />
          <SignOutButton compact />
        </header>
        <div className="overflow-x-auto border-b border-border/60 px-2 py-2 md:hidden">
          <DashboardNav orientation="horizontal" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
