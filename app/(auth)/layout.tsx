import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
