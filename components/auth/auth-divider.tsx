export function AuthDivider({ label = "หรือใช้อีเมล" }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-2 text-xs text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
