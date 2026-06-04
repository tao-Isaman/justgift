import { Logo } from "@/components/logo";
import { SITE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-3">
          <Logo />
        </div>
        <p>
          © {new Date().getFullYear()} {SITE.name}. Built for streamers.
        </p>
        <div className="flex items-center gap-5">
          <a href="#" className="transition-colors hover:text-foreground">
            Terms
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
