import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#how", label: "วิธีใช้งาน" },
  { href: "#features", label: "ฟีเจอร์" },
  { href: "#pricing", label: "ราคา" },
  { href: "#faq", label: "คำถามที่พบบ่อย" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "sm" }), "glow-red-sm")}
          >
            เริ่มใช้ฟรี
          </Link>
        </div>
      </div>
    </header>
  );
}
