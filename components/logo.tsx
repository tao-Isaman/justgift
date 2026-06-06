import Link from "next/link";
import Image from "next/image";
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
      <Image
        src="/logo-mark.webp"
        alt="Just Gift"
        width={32}
        height={32}
        priority
        className="size-8 transition-transform group-hover:scale-105"
      />
      {showText && (
        <span className="font-display text-lg font-bold tracking-[0.18em]">
          JUST <span className="text-primary text-glow">GIFT</span>
        </span>
      )}
    </Link>
  );
}
