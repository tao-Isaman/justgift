"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTHB } from "@/lib/format";
import type { OverlayAlertPayload } from "@/lib/supabase/types";

export function GoalOverlayClient({
  token,
  goalAmount,
  goalTitle,
  accentColor,
  startTotal,
}: {
  token: string;
  goalAmount: number;
  goalTitle: string;
  accentColor: string;
  startTotal: number;
}) {
  const [total, setTotal] = useState(startTotal);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`overlay:${token}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "donation" }, ({ payload }) => {
        const p = payload as OverlayAlertPayload;
        setTotal((t) => t + (Number(p.amount) || 0));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token]);

  const pct = goalAmount > 0 ? Math.min(100, (total / goalAmount) * 100) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 p-6">
      <div
        className="mx-auto max-w-3xl rounded-lg bg-card/90 p-4 backdrop-blur-sm"
        style={{
          boxShadow: `inset 0 0 0 1px ${accentColor}55, 0 0 24px ${accentColor}40`,
        }}
      >
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-heading font-semibold text-foreground">
            {goalTitle}
          </span>
          <span
            className="font-display font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            {formatTHB(total)} / {formatTHB(goalAmount)} ({Math.floor(pct)}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>
    </div>
  );
}
