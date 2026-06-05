"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Membership } from "@/lib/supabase/types";
import { formatTHB } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function isActive(m: Membership) {
  return new Date(m.period_end).getTime() > Date.now();
}

export function MembersList({
  streamerId,
  initial,
}: {
  streamerId: string;
  initial: Membership[];
}) {
  const [items, setItems] = useState<Membership[]>(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`memberships:${streamerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "memberships",
          filter: `streamer_id=eq.${streamerId}`,
        },
        (payload) => {
          const m = payload.new as Membership;
          setItems((prev) => [m, ...prev.filter((x) => x.id !== m.id)]);
          toast.success(`🎉 ${m.member_name} เป็นสมาชิก ${m.tier_name}`);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "memberships",
          filter: `streamer_id=eq.${streamerId}`,
        },
        (payload) => {
          const m = payload.new as Membership;
          setItems((prev) => {
            const next = prev.map((x) => (x.id === m.id ? m : x));
            return next.some((x) => x.id === m.id) ? next : [m, ...next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamerId]);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        ยังไม่มีสมาชิก — สร้างระดับสมาชิกและแชร์เพจของคุณ
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((m) => {
        const active = isActive(m);
        return (
          <li key={m.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {m.member_name}
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
              <p className="mt-0.5 text-xs text-muted-foreground">
                {m.tier_name} · หมดอายุ{" "}
                {new Date(m.period_end).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="font-display shrink-0 text-sm font-bold text-primary tabular-nums">
              {formatTHB(Number(m.total_paid))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
