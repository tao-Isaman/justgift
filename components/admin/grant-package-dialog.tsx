"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminGrantPackage, adminSetFree } from "@/lib/actions/admin";
import type { Plan } from "@/lib/supabase/types";

const TIERS = [
  { value: "pro", label: "โปร" },
  { value: "elite", label: "อีลิท" },
];
const DAYS = [
  { value: "30", label: "30 วัน" },
  { value: "90", label: "90 วัน" },
  { value: "365", label: "365 วัน" },
];

export function GrantPackageDialog({
  profileId,
  username,
  currentPlan,
}: {
  profileId: string;
  username: string;
  currentPlan: Plan;
}) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<"pro" | "elite">("pro");
  const [days, setDays] = useState("30");
  const [pending, startGrant] = useTransition();
  const [revoking, startRevoke] = useTransition();

  function grant() {
    startGrant(async () => {
      const res = await adminGrantPackage({
        profileId,
        tier,
        days: Number(days),
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`ให้แพ็กเกจ @${username} แล้ว`);
      setOpen(false);
    });
  }

  function revoke() {
    startRevoke(async () => {
      const res = await adminSetFree(profileId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`ปรับ @${username} เป็นฟรีแล้ว`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-4" /> ให้แพ็กเกจ
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ให้แพ็กเกจ @{username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>แพ็กเกจ</Label>
            <Select
              items={TIERS}
              value={tier}
              onValueChange={(val) =>
                setTier((val as "pro" | "elite") ?? "pro")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ระยะเวลา</Label>
            <Select
              items={DAYS}
              value={days}
              onValueChange={(val) => setDays(val ?? "30")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            ให้ฟรีโดยไม่ต้องชำระเงิน (บันทึกเป็นคอมพ์ในประวัติ)
          </p>
        </div>
        <DialogFooter>
          {currentPlan !== "free" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={revoke}
              disabled={revoking}
            >
              {revoking ? <Loader2 className="size-4 animate-spin" /> : null}
              ปรับเป็นฟรี
            </Button>
          ) : null}
          <Button type="button" onClick={grant} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            ยืนยันให้แพ็กเกจ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
