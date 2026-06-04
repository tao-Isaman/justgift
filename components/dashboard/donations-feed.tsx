"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Donation, DonationStatus } from "@/lib/supabase/types";
import { formatTHB, timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DonationStatus, { label: string; className: string }> =
  {
    verified: {
      label: "ตรวจสอบแล้ว",
      className: "bg-emerald-500/15 text-emerald-400",
    },
    shown: { label: "แสดงแล้ว", className: "bg-sky-500/15 text-sky-400" },
    pending: {
      label: "รอดำเนินการ",
      className: "bg-amber-500/15 text-amber-400",
    },
    rejected: {
      label: "ปฏิเสธ",
      className: "bg-destructive/15 text-destructive",
    },
  };

export function DonationsFeed({
  profileId,
  initial,
}: {
  profileId: string;
  initial: Donation[];
}) {
  const [items, setItems] = useState<Donation[]>(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`donations:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donations",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) =>
          setItems((prev) => [payload.new as Donation, ...prev].slice(0, 50))
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "donations",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) =>
          setItems((prev) =>
            prev.map((d) =>
              d.id === (payload.new as Donation).id
                ? (payload.new as Donation)
                : d
            )
          )
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        ยังไม่มีโดเนท แชร์เพจของคุณเพื่อเริ่มรับโดเนท
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((d) => {
        const status = STATUS_STYLES[d.status];
        return (
          <li key={d.id} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {d.donor_name}
                </span>
                <Badge className={cn("border-transparent", status.className)}>
                  {status.label}
                </Badge>
              </div>
              {d.message ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {d.message}
                </p>
              ) : null}
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                {timeAgo(d.created_at)}
              </p>
            </div>
            <span className="font-display shrink-0 text-base font-bold text-primary tabular-nums">
              {formatTHB(Number(d.verified_amount ?? d.amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
