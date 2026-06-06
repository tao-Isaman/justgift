"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Banknote,
  CheckCircle2,
  Download,
  ImageUp,
  Loader2,
  Smartphone,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/dashboard/copy-button";
import { AlertCard } from "@/components/alert-card";
import { GifPicker } from "@/components/gif-picker";
import { createClient } from "@/lib/supabase/client";
import { decodeSlipQr } from "@/lib/qr";
import { submitDonation } from "@/lib/actions/donate";
import { parseGifUrl } from "@/lib/media";
import { THAI_BANKS } from "@/lib/constants";
import { formatTHB } from "@/lib/format";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  donorName: z.string().trim().min(1, "กรอกชื่อ").max(40),
  message: z.string().trim().max(200, "ไม่เกิน 200 ตัวอักษร").optional(),
  mediaUrl: z.string().trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Success = { amount: number; name: string; message?: string };

export function DonateForm({
  username,
  displayName,
  promptpayId,
  promptpayQr,
  bankName,
  bankAccount,
  mediaEnabled,
  mediaMin,
  suggestedAmounts = [],
}: {
  username: string;
  displayName: string;
  promptpayId: string | null;
  promptpayQr?: string | null;
  bankName: string | null;
  bankAccount: string | null;
  mediaEnabled: boolean;
  mediaMin: number;
  suggestedAmounts?: number[];
}) {
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { donorName: "", message: "", mediaUrl: "" },
  });

  const bankLabel =
    THAI_BANKS.find((b) => b.value === bankName)?.label ?? bankName;

  function pickFile(f: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function onSubmit(values: FormValues) {
    if (!file) {
      toast.error("กรุณาแนบสลิปโอนเงิน");
      return;
    }
    if (mediaEnabled && values.mediaUrl && !parseGifUrl(values.mediaUrl)) {
      toast.error("ลิงก์ GIF ไม่ถูกต้อง — ต้องเป็นลิงก์ที่ลงท้ายด้วย .gif");
      return;
    }
    startTransition(async () => {
      const payload = await decodeSlipQr(file);
      if (!payload) {
        toast.error(
          "อ่าน QR บนสลิปไม่ได้ ลองใช้รูปที่ชัดและไม่ถูกครอป"
        );
        return;
      }

      // Upload the slip image for the streamer's records (best-effort).
      let slipImagePath: string | undefined;
      try {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const path = `${username}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("slips")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (!error) slipImagePath = path;
      } catch {
        // ignore — verification doesn't depend on the stored image
      }

      const res = await submitDonation({
        username,
        donorName: values.donorName,
        message: values.message,
        payload,
        slipImagePath,
        mediaUrl: mediaEnabled ? values.mediaUrl : undefined,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      setSuccess({
        amount: res.amount ?? 0,
        name: values.donorName,
        message: values.message,
      });
      form.reset();
      pickFile(null);
    });
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="size-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold">ขอบคุณ! 🎉</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              โดเนทของคุณได้รับการยืนยันแล้ว และกำลังแสดงบนสตรีมของ{" "}
              {displayName}
            </p>
          </div>
          <div className="w-full pt-2">
            <AlertCard
              donorName={success.name}
              amount={success.amount}
              message={success.message}
              className="mx-auto"
            />
          </div>
          <Button variant="outline" onClick={() => setSuccess(null)}>
            โดเนทอีกครั้ง
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ส่งโดเนท</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Payment details */}
        <div className="mb-6 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            1 · โอนเงินไปที่
          </p>
          {promptpayId ? (
            <PayRow
              icon={<Smartphone className="size-4" />}
              label="พร้อมเพย์"
              value={promptpayId}
            />
          ) : null}
          {promptpayQr ? (
            <div className="flex flex-col items-center gap-2 pt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={promptpayQr}
                alt="PromptPay QR"
                className="size-44 rounded-lg bg-white p-2"
              />
              <a
                href={promptpayQr}
                download={`promptpay-${username}.png`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
              >
                <Download className="size-4" /> บันทึก QR
              </a>
              <p className="text-center text-xs text-muted-foreground">
                สแกนด้วยแอปธนาคารเพื่อโอน แล้วอัปโหลดสลิปด้านล่าง
              </p>
            </div>
          ) : null}
          {bankLabel && bankAccount ? (
            <PayRow
              icon={<Banknote className="size-4" />}
              label={bankLabel}
              value={bankAccount}
            />
          ) : null}
          {!promptpayId && !bankAccount ? (
            <p className="text-sm text-muted-foreground">
              สตรีมเมอร์ยังไม่ได้เพิ่มช่องทางรับเงิน
            </p>
          ) : null}
          {suggestedAmounts.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">ยอดแนะนำ:</span>
              {suggestedAmounts.map((n) => (
                <span
                  key={n}
                  className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {formatTHB(n)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              2 · ข้อมูลแจ้งเตือน
            </p>
            <p className="-mt-2 text-xs text-muted-foreground">
              ยอดเงินจะดึงจากสลิปของคุณอัตโนมัติ ไม่ต้องกรอกเอง
            </p>
            <FormField
              control={form.control}
              name="donorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อของคุณ</FormLabel>
                  <FormControl>
                    <Input placeholder="แสดงบนสตรีม" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ข้อความ (ไม่บังคับ)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="ฝากข้อความถึงสตรีมเมอร์…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mediaEnabled ? (
              <FormField
                control={form.control}
                name="mediaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>แนบ GIF มีม (ไม่บังคับ)</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      ค้นหาหรือสุ่ม GIF แล้วเลือก — เด้งขึ้นจอสตรีมเมื่อโดเนทตั้งแต่
                      ฿{mediaMin} ขึ้นไป
                    </p>
                    <FormControl>
                      <GifPicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <p className="pt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              3 · อัปโหลดสลิป
            </p>
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
                  className="size-16 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">พร้อมตรวจสอบ</p>
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
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <ImageUp className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  แตะเพื่ออัปโหลดสลิปโอนเงิน
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG หรือ WEBP ที่เห็น QR ชัดเจน
                </span>
              </button>
            )}

            <Button
              type="submit"
              size="lg"
              className="glow-red-sm w-full"
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "กำลังตรวจสลิป…" : "ตรวจสลิปแล้วส่งแจ้งเตือน"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
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
