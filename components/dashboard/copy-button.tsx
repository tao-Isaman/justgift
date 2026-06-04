"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("คัดลอกแล้ว");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      onClick={copy}
      aria-label="Copy"
    >
      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
    </Button>
  );
}
