"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LeaderboardCard, type LeaderboardEntry } from "@/components/leaderboard-card";
import { OverlayHeartbeat } from "@/components/overlay-heartbeat";
import type { OverlayAlertPayload } from "@/lib/supabase/types";

export function LeaderboardOverlayClient({
  token,
  accentColor,
  startEntries,
}: {
  token: string;
  accentColor: string;
  startEntries: LeaderboardEntry[];
}) {
  const totalsRef = useRef<Map<string, number>>(
    new Map(startEntries.map((e) => [e.name, e.total]))
  );
  const [entries, setEntries] = useState<LeaderboardEntry[]>(startEntries);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`overlay:${token}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "donation" }, ({ payload }) => {
        const p = payload as OverlayAlertPayload;
        const name = p.donorName || "—";
        totalsRef.current.set(
          name,
          (totalsRef.current.get(name) ?? 0) + (Number(p.amount) || 0)
        );
        const next = Array.from(totalsRef.current, ([n, t]) => ({
          name: n,
          total: t,
        }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setEntries(next);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-10">
      <OverlayHeartbeat token={token} />
      <div className="w-full max-w-md">
        <LeaderboardCard entries={entries} accentColor={accentColor} />
      </div>
    </div>
  );
}
