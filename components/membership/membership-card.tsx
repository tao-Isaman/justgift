import { Check } from "lucide-react";
import { formatTHB } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TierView = {
  name: string;
  price: number;
  days: number;
  perks: string[];
  color: string;
};

/** Presentational membership-tier card. Shared by the public page + dashboard. */
export function MembershipCard({
  tier,
  action,
  className,
}: {
  tier: TierView;
  action?: React.ReactNode;
  className?: string;
}) {
  const color = tier.color || "#dc2626";
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-5",
        className
      )}
      style={{ boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
      />
      <h3 className="font-heading text-lg font-bold" style={{ color }}>
        {tier.name}
      </h3>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-extrabold tabular-nums">
          {formatTHB(tier.price)}
        </span>
        <span className="text-sm text-muted-foreground">/ {tier.days} วัน</span>
      </div>
      {tier.perks.length > 0 ? (
        <ul className="mt-4 flex-1 space-y-2 text-sm">
          {tier.perks.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0" style={{ color }} />
              <span className="text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
