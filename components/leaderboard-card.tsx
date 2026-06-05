import { cn } from "@/lib/utils";
import { formatTHB } from "@/lib/format";

export type LeaderboardEntry = { name: string; total: number };

/** Top-donor leaderboard. Shared by the overlay widget and the settings
 *  preview. Pure/presentational. */
export function LeaderboardCard({
  entries,
  accentColor = "#dc2626",
  title = "ผู้โดเนทสูงสุด",
  className,
}: {
  entries: LeaderboardEntry[];
  accentColor?: string;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full rounded-lg bg-card/90 p-4 backdrop-blur-sm", className)}
      style={{
        boxShadow: `inset 0 0 0 1px ${accentColor}55, 0 0 24px ${accentColor}40`,
      }}
    >
      <p className="font-heading mb-2.5 text-sm font-semibold">{title}</p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูลเดือนนี้</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e, i) => (
            <li key={`${e.name}-${i}`} className="flex items-center gap-2 text-sm">
              <span
                className="font-display grid size-5 shrink-0 place-items-center rounded text-xs font-bold"
                style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              <span
                className="font-display font-bold tabular-nums"
                style={{ color: accentColor }}
              >
                {formatTHB(e.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
