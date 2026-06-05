"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Lock, Play, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCard } from "@/components/alert-card";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  ALERT_VARIANTS,
  buildTtsText,
  playAlertSound,
  speakDonation,
} from "@/lib/overlay-fx";
import { updateAlertSettings } from "@/lib/actions/alerts";
import { sendTestAlert } from "@/lib/actions/overlay";
import {
  alertSettingsSchema,
  type AlertSettingsValues,
} from "@/lib/validations";
import { TTS_VOICES, planAllows } from "@/lib/constants";
import type {
  AlertAnimation,
  AlertPosition,
  AlertSettings,
  Plan,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const ANIMATIONS: { value: AlertAnimation; label: string }[] = [
  { value: "slide", label: "สไลด์" },
  { value: "zoom", label: "ซูม" },
  { value: "flip", label: "พลิก 3D" },
  { value: "glitch", label: "กลิตช์" },
];

const POSITIONS: { value: AlertPosition; label: string }[] = [
  { value: "top-left", label: "บนซ้าย" },
  { value: "top-center", label: "บนกลาง" },
  { value: "top-right", label: "บนขวา" },
  { value: "center", label: "กลางจอ" },
];

const SAMPLE = {
  name: "ผู้ทดสอบ",
  amount: 250,
  message: "ขอบคุณสำหรับสตรีมครับ! 🎉",
};

export function AlertSettingsForm({
  plan,
  settings,
  overlayUrl,
}: {
  plan: Plan;
  settings: AlertSettings | null;
  overlayUrl: string;
}) {
  const pro = planAllows(plan, "pro");
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [replay, setReplay] = useState(0);

  const { control, handleSubmit } = useForm<AlertSettingsValues>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      animation: settings?.animation ?? "slide",
      position: settings?.position ?? "top-center",
      durationMs: Number(settings?.duration_ms ?? 7000),
      accentColor: settings?.accent_color ?? "#dc2626",
      textColor: settings?.text_color ?? "#ffffff",
      minAmount: Number(settings?.min_amount ?? 1),
      soundUrl: settings?.sound_url ?? "",
      soundVolume: Number(settings?.sound_volume ?? 0.8),
      imageUrl: settings?.image_url ?? "",
      ttsEnabled: settings?.tts_enabled ?? false,
      ttsVoice: settings?.tts_voice ?? "th-TH",
      ttsRate: Number(settings?.tts_rate ?? 1),
      ttsVolume: Number(settings?.tts_volume ?? 1),
      bigThreshold: Number(settings?.big_threshold ?? 500),
      bigEffect: settings?.big_effect ?? true,
    },
  });

  const v = useWatch({ control }) as AlertSettingsValues;
  const variant = ALERT_VARIANTS[v.animation];

  function onSubmit(values: AlertSettingsValues) {
    startSave(async () => {
      const res = await updateAlertSettings(values);
      if (res?.error) toast.error(res.error);
      else toast.success("บันทึกการแจ้งเตือนแล้ว");
    });
  }

  function replayPreview() {
    setReplay((r) => r + 1);
    playAlertSound(v.soundUrl || null, v.soundVolume, false);
    if (v.ttsEnabled) {
      speakDonation(
        buildTtsText(SAMPLE.name, SAMPLE.amount, SAMPLE.message),
        v.ttsVoice || "th-TH",
        v.ttsRate,
        v.ttsVolume
      );
    }
  }

  function sendTest(big: boolean) {
    startTest(async () => {
      const res = await sendTestAlert(
        big
          ? { amount: 9999, message: "โดเนทก้อนใหญ่มาแล้ว! 🎉🎉" }
          : undefined
      );
      if (res?.error) toast.error(res.error);
      else toast.success("ส่งการแจ้งเตือนไป overlay แล้ว");
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        {/* Style — all plans */}
        <Section title="สไตล์">
          <Row label="อนิเมชัน">
            <Controller
              control={control}
              name="animation"
              render={({ field }) => (
                <Select
                  items={ANIMATIONS}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange((val as AlertAnimation) ?? "slide")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMATIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
          <Row label="ตำแหน่งบนจอ">
            <Controller
              control={control}
              name="position"
              render={({ field }) => (
                <Select
                  items={POSITIONS}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange((val as AlertPosition) ?? "top-center")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
          <Row label={`ระยะเวลาแสดง — ${(v.durationMs / 1000).toFixed(1)} วิ`}>
            <Controller
              control={control}
              name="durationMs"
              render={({ field }) => (
                <Slider
                  min={2000}
                  max={15000}
                  step={500}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange(Array.isArray(val) ? val[0] : val)
                  }
                />
              )}
            />
          </Row>
        </Section>

        {/* Appearance — Pro */}
        <Section title="หน้าตา" locked={!pro}>
          <div className="grid grid-cols-2 gap-4">
            <Row label="สีหลัก">
              <Controller
                control={control}
                name="accentColor"
                render={({ field }) => (
                  <ColorInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!pro}
                  />
                )}
              />
            </Row>
            <Row label="สีข้อความ">
              <Controller
                control={control}
                name="textColor"
                render={({ field }) => (
                  <ColorInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!pro}
                  />
                )}
              />
            </Row>
          </div>
          <Row label="รูป / GIF แจ้งเตือน (ลิงก์)">
            <Controller
              control={control}
              name="imageUrl"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Input
                    placeholder="https://…"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!pro}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </Row>
        </Section>

        {/* Sound — Pro */}
        <Section title="เสียง" locked={!pro}>
          <Row label="เสียงแจ้งเตือน (ลิงก์ mp3/wav)">
            <Controller
              control={control}
              name="soundUrl"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Input
                    placeholder="เว้นว่างเพื่อใช้เสียงในระบบ"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!pro}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </Row>
          <Row label={`ระดับเสียง — ${Math.round(v.soundVolume * 100)}%`}>
            <Controller
              control={control}
              name="soundVolume"
              render={({ field }) => (
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange(Array.isArray(val) ? val[0] : val)
                  }
                  disabled={!pro}
                />
              )}
            />
          </Row>
        </Section>

        {/* TTS — Pro */}
        <Section title="อ่านข้อความเป็นเสียง (TTS)" locked={!pro}>
          <Row label="เปิดใช้งาน">
            <Controller
              control={control}
              name="ttsEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c)}
                  disabled={!pro}
                />
              )}
            />
          </Row>
          <Row label="เสียงพากย์">
            <Controller
              control={control}
              name="ttsVoice"
              render={({ field }) => (
                <Select
                  items={TTS_VOICES}
                  value={field.value || "th-TH"}
                  onValueChange={(val) => field.onChange(val ?? "th-TH")}
                  disabled={!pro}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TTS_VOICES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
          <Row label={`ความเร็ว — ${v.ttsRate.toFixed(1)}x`}>
            <Controller
              control={control}
              name="ttsRate"
              render={({ field }) => (
                <Slider
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange(Array.isArray(val) ? val[0] : val)
                  }
                  disabled={!pro}
                />
              )}
            />
          </Row>
          <Row label={`ระดับเสียงพากย์ — ${Math.round(v.ttsVolume * 100)}%`}>
            <Controller
              control={control}
              name="ttsVolume"
              render={({ field }) => (
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange(Array.isArray(val) ? val[0] : val)
                  }
                  disabled={!pro}
                />
              )}
            />
          </Row>
        </Section>

        {/* Rules — Pro */}
        <Section title="กติกา" locked={!pro}>
          <Row label="ยอดโดเนทขั้นต่ำ (฿)">
            <Controller
              control={control}
              name="minAmount"
              render={({ field }) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  disabled={!pro}
                />
              )}
            />
          </Row>
          <Row label="ยอดโดเนทใหญ่ตั้งแต่ (฿)">
            <Controller
              control={control}
              name="bigThreshold"
              render={({ field }) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  disabled={!pro}
                />
              )}
            />
          </Row>
          <Row label="เอฟเฟกต์ confetti เมื่อโดเนทใหญ่">
            <Controller
              control={control}
              name="bigEffect"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c)}
                  disabled={!pro}
                />
              )}
            />
          </Row>
        </Section>
      </div>

      {/* Preview / actions */}
      <div className="lg:col-span-1">
        <div className="space-y-3 lg:sticky lg:top-6">
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">ตัวอย่าง</p>
              <div className="relative grid min-h-64 place-items-center overflow-hidden rounded-lg border border-border/60 bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-[length:22px_22px] p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={replay}
                    initial={variant.initial}
                    animate={variant.animate}
                    exit={variant.exit}
                    transition={variant.transition}
                  >
                    <AlertCard
                      donorName={SAMPLE.name}
                      amount={SAMPLE.amount}
                      message={SAMPLE.message}
                      accentColor={v.accentColor}
                      textColor={v.textColor}
                      imageUrl={v.imageUrl || null}
                      watermark={!pro}
                      className="w-full"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={replayPreview}
              >
                <Play className="size-4" /> เล่นตัวอย่าง
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => sendTest(false)}
                  disabled={testing}
                >
                  ทดสอบ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => sendTest(true)}
                  disabled={testing}
                >
                  ยอดใหญ่ 🎉
                </Button>
              </div>

              <Button
                type="submit"
                className="glow-red-sm w-full"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                บันทึก
              </Button>
              <p className="text-xs text-muted-foreground">
                ปุ่มทดสอบใช้ค่าที่บันทึกแล้ว — กดบันทึกก่อนเพื่อดูผลล่าสุดบน
                overlay
              </p>

              <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                <input
                  readOnly
                  value={overlayUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-input/30 px-2.5 font-mono text-xs text-muted-foreground outline-none"
                />
                <CopyButton value={overlayUrl} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  locked = false,
  children,
}: {
  title: string;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          {locked ? (
            <Link href="/dashboard/billing">
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" /> อัปเกรดเป็นโปร
              </Badge>
            </Link>
          ) : null}
        </div>
        <div className={cn("space-y-4", locked && "opacity-60")}>{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="font-mono"
      />
    </div>
  );
}
