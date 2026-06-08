"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoalBar } from "@/components/goal-bar";
import { OverlayHeartbeat } from "@/components/overlay-heartbeat";
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
    <div className="fixed inset-0 flex items-center justify-center p-10">
      <OverlayHeartbeat token={token} />
      <GoalBar
        title={goalTitle}
        total={total}
        goalAmount={goalAmount}
        accentColor={accentColor}
        className="w-full max-w-4xl"
      />
    </div>
  );
}
