"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={cn(!compact && "w-full justify-start text-muted-foreground")}
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      aria-label="Sign out"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      {!compact && (pending ? "Signing out…" : "Sign out")}
    </Button>
  );
}
