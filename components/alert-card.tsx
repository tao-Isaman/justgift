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
  fontFamily?: string;
  className?: string;
  /** "lg" = bigger box + text for the on-stream overlay (easier to read). */
  size?: "default" | "lg";
};

const SIZES = {
  default: {
    box: "w-[420px] p-5",
    gap: "gap-4",
    icon: "size-14",
    glyph: "size-7",
    name: "text-lg",
    amount: "text-3xl",
    message: "mt-3 text-sm",
  },
  lg: {
    box: "w-[760px] p-10",
    gap: "gap-7",
    icon: "size-28",
    glyph: "size-14",
    name: "text-4xl",
    amount: "text-7xl",
    message: "mt-6 text-3xl",
  },
} as const;

/**
 * The donation alert visual. Pure/presentational — reused by the marketing
 * hero, the dashboard preview/test, and the live OBS overlay (size="lg").
 */
export function AlertCard({
  donorName,
  amount,
  message,
  accentColor = "#dc2626",
  textColor = "#ffffff",
  imageUrl,
  watermark = false,
  fontFamily,
  className,
  size = "default",
}: AlertCardProps) {
  const s = SIZES[size];
  return (
    <div
      className={cn(
        "relative max-w-full overflow-hidden rounded-lg bg-card/95 backdrop-blur-sm clip-corner",
        s.box,
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
      <div className={cn("flex items-center", s.gap)}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className={cn("shrink-0 rounded-md object-cover", s.icon)}
          />
        ) : (
          <span
            className={cn("grid shrink-0 place-items-center rounded-md", s.icon)}
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            <Gift className={s.glyph} />
          </span>
        )}
        <div className="min-w-0">
          <p
            className={cn("font-heading leading-tight", s.name)}
            style={{ color: textColor, fontFamily }}
          >
            <span className="font-bold" style={{ color: accentColor }}>
              {donorName}
            </span>{" "}
            โดเนท
          </p>
          <p
            className={cn("font-display font-extrabold tabular-nums", s.amount)}
            style={{ color: accentColor }}
          >
            {formatTHB(amount)}
          </p>
        </div>
      </div>
      {message ? (
        <p
          className={cn("line-clamp-3 leading-relaxed", s.message)}
          style={{ color: textColor, fontFamily }}
        >
          {message}
        </p>
      ) : null}
      {watermark ? (
        <span className="absolute right-2 bottom-1 font-mono text-[10px] tracking-wide text-muted-foreground/60">
          Just Gift
        </span>
      ) : null}
    </div>
  );
}
