import Link from "next/link";
import { Logo } from "@/components/logo";
import { GrainOverlay } from "@/components/grain-overlay";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "ไม่พบหน้า" };

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-glow" />
      <div className="relative">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <p className="font-display text-7xl font-extrabold text-primary text-glow sm:text-8xl">
          404
        </p>
        <h1 className="font-heading mt-4 text-2xl font-bold">
          ไม่พบหน้าที่คุณค้นหา
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          หน้านี้อาจถูกย้าย ถูกลบ หรือไม่เคยมีอยู่
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "glow-red-sm")}>
            กลับหน้าแรก
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            ไปที่แดชบอร์ด
          </Link>
        </div>
      </div>
      <GrainOverlay />
    </div>
  );
}
