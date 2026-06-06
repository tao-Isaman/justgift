"use client";

import { useTransition } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminSendTestAlert } from "@/lib/actions/admin";

/** Admin button: send a no-slip test alert to a streamer's overlay. */
export function AdminTestAlertButton({
  profileId,
  username,
}: {
  profileId: string;
  username: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await adminSendTestAlert(profileId);
          if (res.error) toast.error(res.error);
          else toast.success(`ส่งแจ้งเตือนทดสอบไปที่ @${username} แล้ว`);
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Bell className="size-4" />
      )}
      ทดสอบ
    </Button>
  );
}
