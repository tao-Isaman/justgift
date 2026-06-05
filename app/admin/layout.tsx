import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth-admin";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="glass-cards relative flex min-h-svh">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 bg-glow"
      />
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar/70 p-4 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2 px-2">
          <Logo />
          <Badge variant="outline" className="border-primary/40 text-primary">
            ADMIN
          </Badge>
        </div>
        <div className="mt-6 flex-1">
          <AdminNav />
        </div>
        <div className="space-y-3 border-t border-border/60 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> กลับแดชบอร์ด
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <Logo />
            <Badge variant="outline" className="border-primary/40 text-primary">
              ADMIN
            </Badge>
          </div>
          <SignOutButton compact />
        </header>
        <div className="overflow-x-auto border-b border-border/60 px-2 py-2 md:hidden">
          <AdminNav orientation="horizontal" />
        </div>
        <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
