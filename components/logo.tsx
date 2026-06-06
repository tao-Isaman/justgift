import Link from "next/link";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground glow-red-sm clip-corner transition-transform group-hover:scale-105">
        <Gift className="size-4.5" />
      </span>
      {showText && (
        <span className="font-display text-lg font-bold tracking-[0.18em]">
          JUST <span className="text-primary text-glow">GIFT</span>
        </span>
      )}
    </Link>
  );
}
