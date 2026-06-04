import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTHB } from "@/lib/format";

export type AlertCardProps = {
  donorName: string;
  amount: number;
  message?: string | null;
  accentColor?: string;
  textColor?: string;
  imageUrl?: string | null;
  watermark?: boolean;
  className?: string;
};

/**
 * The donation alert visual. Pure/presentational — reused by the marketing
 * hero, the dashboard preview/test, and the live OBS overlay.
 */
export function AlertCard({
  donorName,
  amount,
  message,
  accentColor = "#dc2626",
  textColor = "#ffffff",
  imageUrl,
  watermark = false,
  className,
}: AlertCardProps) {
  return (
    <div
      className={cn(
        "relative w-[420px] max-w-full overflow-hidden rounded-lg bg-card/95 p-5 backdrop-blur-sm clip-corner",
        className
      )}
      style={{
        boxShadow: `inset 0 0 0 1px ${accentColor}55, 0 0 30px ${accentColor}55`,
      }}
    >
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center gap-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="size-14 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span
            className="grid size-14 shrink-0 place-items-center rounded-md"
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            <Gift className="size-7" />
          </span>
        )}
        <div className="min-w-0">
          <p
            className="font-heading text-lg leading-tight"
            style={{ color: textColor }}
          >
            <span className="font-bold" style={{ color: accentColor }}>
              {donorName}
            </span>{" "}
            donated
          </p>
          <p
            className="font-display text-3xl font-extrabold tabular-nums"
            style={{ color: accentColor }}
          >
            {formatTHB(amount)}
          </p>
        </div>
      </div>
      {message ? (
        <p
          className="mt-3 line-clamp-3 text-sm leading-relaxed"
          style={{ color: textColor }}
        >
          {message}
        </p>
      ) : null}
      {watermark ? (
        <span className="absolute right-2 bottom-1 font-mono text-[10px] tracking-wide text-muted-foreground/60">
          justgift.app
        </span>
      ) : null}
    </div>
  );
}
