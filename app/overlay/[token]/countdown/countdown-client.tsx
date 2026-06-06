"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OverlayHeartbeat } from "@/components/overlay-heartbeat";
import { nowMs } from "@/lib/format";
import type { CountdownState } from "@/lib/supabase/types";

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function CountdownOverlayClient({
  token,
  accentColor,
  initial,
}: {
  token: string;
  accentColor: string;
  initial: CountdownState;
}) {
  const [state, setState] = useState<CountdownState>(initial);
  const [now, setNow] = useState<number>(() => nowMs());

  // Tick the clock.
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMs()), 250);
    return () => window.clearInterval(id);
  }, []);

  // Live updates from the dashboard + donations.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`overlay:${token}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "countdown" }, ({ payload }) => {
        setState(payload as CountdownState);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [token]);

  const remaining =
    state.running && state.endsAt
      ? new Date(state.endsAt).getTime() - now
      : state.remainingMs;
  const done = remaining <= 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <OverlayHeartbeat token={token} />
      <div
        className="rounded-2xl bg-black/55 px-12 py-8 backdrop-blur-sm"
        style={{ boxShadow: `0 0 40px ${accentColor}88` }}
      >
        <p
          className="text-center font-display text-8xl font-extrabold tabular-nums tracking-tight"
          style={{ color: done ? "#ffffff" : accentColor, textShadow: `0 0 24px ${accentColor}aa` }}
        >
          {fmt(remaining)}
        </p>
      </div>
    </div>
  );
}
