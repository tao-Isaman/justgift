"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CreditCard, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/alerts", label: "การแจ้งเตือน", icon: Bell },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
  { href: "/dashboard/billing", label: "การเรียกเก็บเงิน", icon: CreditCard },
];

export function DashboardNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row"
      )}
    >
      {ITEMS.map((it) => {
        const active = it.exact
          ? pathname === it.href
          : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <it.icon className="size-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
