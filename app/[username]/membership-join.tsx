"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Crown,
  ImageUp,
  Loader2,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/dashboard/copy-button";
import { MembershipCard } from "@/components/membership/membership-card";
import { createClient } from "@/lib/supabase/client";
import { decodeSlipQr } from "@/lib/qr";
import { redeemMembershipSlip } from "@/lib/actions/membership";
import { formatTHB, isFuture } from "@/lib/format";
import { THAI_BANKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type JoinTier = {
  id: string;
  name: string;
  price: number;
  days: number;
  perks: string[];
  color: string;
};

export type CurrentMembership = {
  tier_name: string;
  period_end: string;
  status: string;
} | null;

export function MembershipJoin({
  username,
  displayName,
  tiers,
  promptpayId,
  bankName,
  bankAccount,
  isLoggedIn,
  loginHref,
  current,
}: {
  username: string;
  displayName: string;
  tiers: JoinTier[];
  promptpayId: string | null;
  bankName: string | null;
  bankAccount: string | null;
  isLoggedIn: boolean;
  loginHref: string;
  current: CurrentMembership;
}) {
  const router = useRouter();
  const [openTier, setOpenTier] = useState<JoinTier | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (tiers.length === 0) return null;

  const bankLabel =
    THAI_BANKS.find((b) => b.value === bankName)?.label ?? bankName;
  const activeNow = !!current && isFuture(current.period_end);

  function pickFile(f: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function close() {
    setOpenTier(null);
    pickFile(null);
  }

  function onJoin() {
    const tier = openTier;
    if (!tier) return;
    if (!file) {
      toast.error("กรุณาแนบสลิปโอนเงิน");
      return;
    }
    startTransition(async () => {
      const payload = await decodeSlipQr(file);
      if (!payload) {
        toast.error("อ่าน QR บนสลิปไม่ได้ ลองใช้รูปที่ชัดและไม่ถูกครอป");
        return;
      }

      let slipImagePath: string | undefined;
      try {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const path = `${username}/mem-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("slips")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (!error) slipImagePath = path;
      } catch {
        // ignore — verification doesn't depend on the stored image
      }

      const res = await redeemMembershipSlip({
        username,
        tierId: tier.id,
        payload,
        slipImagePath,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`เป็นสมาชิกระดับ ${res.tierName ?? tier.name} แล้ว! 🎉`);
      close();
      router.refresh();
    });
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Crown className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold">
          เป็นสมาชิกของ {displayName}
        </h2>
      </div>

      {activeNow ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            <span>
              คุณเป็นสมาชิกระดับ{" "}
              <span className="font-semibold">{current!.tier_name}</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            ต่ออายุได้ถึง{" "}
            {new Date(current!.period_end).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {tiers.map((tier) => (
          <MembershipCard
            key={tier.id}
            tier={tier}
            action={
              isLoggedIn ? (
                <Button
                  type="button"
                  className="w-full"
                  style={{ backgroundColor: tier.color }}
                  onClick={() => {
                    pickFile(null);
                    setOpenTier(tier);
                  }}
                >
                  {activeNow ? "ต่ออายุ / เปลี่ยนระดับ" : "สมัครสมาชิก"}
                </Button>
              ) : (
                <Link
                  href={loginHref}
                  className={cn(buttonVariants(), "w-full")}
                >
                  เข้าสู่ระบบเพื่อสมัคร
                </Link>
              )
            }
          />
        ))}
      </div>

      <Dialog open={!!openTier} onOpenChange={(o) => (o ? null : close())}>
        <DialogContent className="sm:max-w-md">
          {openTier ? (
            <>
              <DialogHeader>
                <DialogTitle>สมัครสมาชิก {openTier.name}</DialogTitle>
                <DialogDescription>
                  โอน {formatTHB(openTier.price)} ไปยังสตรีมเมอร์โดยตรง
                  แล้วอัปโหลดสลิปเพื่อยืนยัน — เงินเข้าบัญชีสตรีมเมอร์ ไม่ผ่านคนกลาง
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      ยอดที่ต้องโอน
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-display text-lg font-bold">
                        {formatTHB(openTier.price)}
                      </span>
                      <CopyButton value={String(openTier.price)} />
                    </span>
                  </div>
                  {promptpayId ? (
                    <PayRow
                      icon={<Smartphone className="size-4" />}
                      label="พร้อมเพย์"
                      value={promptpayId}
                    />
                  ) : null}
                  {bankLabel && bankAccount ? (
                    <PayRow
                      icon={<Banknote className="size-4" />}
                      label={bankLabel}
                      value={bankAccount}
                    />
                  ) : null}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                {previewUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="ตัวอย่างสลิป"
                      className="size-14 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        พร้อมตรวจสอบ
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => pickFile(null)}
                      aria-label="ลบสลิป"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    <ImageUp className="size-6 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      แตะเพื่ออัปโหลดสลิปโอนเงิน
                    </span>
                  </button>
                )}

                <Button
                  type="button"
                  className="glow-red-sm w-full"
                  onClick={onJoin}
                  disabled={pending}
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {pending ? "กำลังตรวจสลิป…" : "ยืนยันการสมัคร"}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PayRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

export type { JoinTier as MembershipJoinTier };
