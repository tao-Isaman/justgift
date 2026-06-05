import { cn } from "@/lib/utils";
import { formatTHB } from "@/lib/format";

/** The donation-goal progress bar. Shared by the overlay widget and the
 *  settings preview so they always match. Pure/presentational. */
export function GoalBar({
  title,
  total,
  goalAmount,
  accentColor = "#dc2626",
  className,
}: {
  title: string;
  total: number;
  goalAmount: number;
  accentColor?: string;
  className?: string;
}) {
  const pct = goalAmount > 0 ? Math.min(100, (total / goalAmount) * 100) : 0;

  return (
    <div
      className={cn("w-full rounded-lg bg-card/90 p-4 backdrop-blur-sm", className)}
      style={{
        boxShadow: `inset 0 0 0 1px ${accentColor}55, 0 0 24px ${accentColor}40`,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
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
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}
