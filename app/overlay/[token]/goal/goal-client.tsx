"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoalBar } from "@/components/goal-bar";
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

  return (
    <div className="fixed inset-x-0 bottom-0 p-6">
      <GoalBar
        title={goalTitle}
        total={total}
        goalAmount={goalAmount}
        accentColor={accentColor}
        className="mx-auto max-w-3xl"
      />
    </div>
  );
}
