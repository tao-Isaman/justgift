"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/dashboard/copy-button";
import { sendTestAlert } from "@/lib/actions/overlay";
import { cn } from "@/lib/utils";

const readonlyInput =
  "h-9 min-w-0 flex-1 rounded-lg border border-input bg-input/30 px-2.5 font-mono text-xs text-muted-foreground outline-none";

export function OverlayCard({
  overlayUrl,
  pageUrl,
}: {
  overlayUrl: string;
  pageUrl: string;
}) {
  const [pending, startTransition] = useTransition();

  function test() {
    startTransition(async () => {
      const res = await sendTestAlert();
      if (res?.error) toast.error(res.error);
      else toast.success("ส่งการแจ้งเตือนทดสอบไปที่ overlay แล้ว");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overlay สำหรับ OBS</CardTitle>
        <CardDescription>
          เพิ่ม URL นี้เป็น Browser Source ใน OBS (1920×1080 พื้นหลังโปร่งใส)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={overlayUrl}
            onFocus={(e) => e.currentTarget.select()}
            className={readonlyInput}
          />
          <CopyButton value={overlayUrl} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={test}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            ทดสอบการแจ้งเตือน
          </Button>
          <a
            href={overlayUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            เปิด overlay <ExternalLink className="size-4" />
          </a>
        </div>

        <Separator className="my-1" />

        <div>
          <p className="text-sm font-medium">เพจรับโดเนทของคุณ</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={pageUrl}
              onFocus={(e) => e.currentTarget.select()}
              className={readonlyInput}
            />
            <CopyButton value={pageUrl} />
            <Link
              href={pageUrl}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
              aria-label="เปิดเพจรับโดเนท"
            >
              <ExternalLink className="size-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
