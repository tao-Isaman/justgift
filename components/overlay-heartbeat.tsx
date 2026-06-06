"use client";

import { useEffect } from "react";

/** Pings the server every 30s so admins can see this streamer is live. */
export function OverlayHeartbeat({ token }: { token: string }) {
  useEffect(() => {
    const ping = () => {
      fetch(`/api/overlay/ping?token=${encodeURIComponent(token)}`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    };
    ping();
    const id = window.setInterval(ping, 30_000);
    return () => window.clearInterval(id);
  }, [token]);
  return null;
}
