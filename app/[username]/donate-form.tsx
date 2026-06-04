"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Banknote,
  CheckCircle2,
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
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/dashboard/copy-button";
import { AlertCard } from "@/components/alert-card";
import { createClient } from "@/lib/supabase/client";
import { decodeSlipQr } from "@/lib/qr";
import { submitDonation } from "@/lib/actions/donate";
import { THAI_BANKS } from "@/lib/constants";

const formSchema = z.object({
  donorName: z.string().trim().min(1, "Enter a name").max(40),
  message: z.string().trim().max(200, "Keep it under 200 characters").optional(),
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 && n <= 1_000_000;
    }, "Enter a valid amount"),
});

type FormValues = z.infer<typeof formSchema>;

type Success = { amount: number; name: string; message?: string };

export function DonateForm({
  username,
  displayName,
  promptpayId,
  bankName,
  bankAccount,
}: {
  username: string;
  displayName: string;
  promptpayId: string | null;
  bankName: string | null;
  bankAccount: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { donorName: "", message: "", amount: "" },
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
      toast.error("Please attach your transfer slip");
      return;
    }
    startTransition(async () => {
      const payload = await decodeSlipQr(file);
      if (!payload) {
        toast.error(
          "We couldn't read the QR on that slip. Try a clearer, uncropped image."
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
        amount: Number(values.amount),
        payload,
        slipImagePath,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      setSuccess({
        amount: res.amount ?? Number(values.amount),
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
            <h2 className="font-heading text-xl font-bold">Thank you! 🎉</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your donation was verified and is now live on {displayName}&apos;s
              stream.
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
            Send another donation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a donation</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Payment details */}
        <div className="mb-6 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            1 · Transfer to
          </p>
          {promptpayId ? (
            <PayRow
              icon={<Smartphone className="size-4" />}
              label="PromptPay"
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
          {!promptpayId && !bankAccount ? (
            <p className="text-sm text-muted-foreground">
              This streamer hasn&apos;t added payment details yet.
            </p>
          ) : null}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              2 · Your alert
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="donorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input placeholder="Shown on stream" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (฿)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        step="1"
                        placeholder="100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Say something nice…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="pt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              3 · Upload your slip
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
                  alt="Slip preview"
                  className="size-16 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Ready to verify
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => pickFile(null)}
                  aria-label="Remove slip"
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
                  Tap to upload your transfer slip
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG or WEBP with the QR visible
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
              {pending ? "Verifying slip…" : "Verify & send alert"}
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
