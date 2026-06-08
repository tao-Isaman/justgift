import { cn } from "@/lib/utils";
import { formatTHB } from "@/lib/format";

/** The donation-goal progress bar. Shared by the overlay widget and the
 *  settings preview so they always match. Pure/presentational. */
const SIZES = {
  default: { box: "p-4", header: "mb-2 text-sm", bar: "h-3" },
  lg: { box: "p-6", header: "mb-4 text-2xl", bar: "h-9" },
} as const;

export function GoalBar({
  title,
  total,
  goalAmount,
  accentColor = "#dc2626",
  className,
  size = "default",
}: {
  title: string;
  total: number;
  goalAmount: number;
  accentColor?: string;
  className?: string;
  /** "lg" = taller bar + bigger text for the on-stream overlay. */
  size?: "default" | "lg";
}) {
  const pct = goalAmount > 0 ? Math.min(100, (total / goalAmount) * 100) : 0;
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "w-full rounded-lg bg-card/90 backdrop-blur-sm",
        s.box,
        className
      )}
      style={{
        boxShadow: `inset 0 0 0 1px ${accentColor}55, 0 0 24px ${accentColor}40`,
      }}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          s.header
        )}
      >
        <span className="font-heading truncate font-semibold text-foreground">
          {title}
        </span>
        <span
          className="font-display shrink-0 font-bold tabular-nums"
          style={{ color: accentColor }}
        >
          {formatTHB(total)} / {formatTHB(goalAmount)} ({Math.floor(pct)}%)
        </span>
      </div>
      <div className={cn("overflow-hidden rounded-full bg-muted", s.bar)}>
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}
