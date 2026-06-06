"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Lock, Play, Plus, Save, Trash2 } from "lucide-react";
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
import { GoalBar } from "@/components/goal-bar";
import { LeaderboardCard } from "@/components/leaderboard-card";
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
import {
  ALERT_FONTS,
  TTS_VOICES,
  fontFamily,
  planAllows,
} from "@/lib/constants";
import type {
  AlertAnimation,
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

const GOAL_PERIODS: { value: string; label: string }[] = [
  { value: "0", label: "ตลอดกาล" },
  { value: "7", label: "7 วันล่าสุด" },
  { value: "30", label: "30 วันล่าสุด" },
  { value: "90", label: "90 วันล่าสุด" },
];

const SAMPLE = {
  name: "ผู้ทดสอบ",
  amount: 250,
  message: "ขอบคุณสำหรับสตรีมครับ! 🎉",
};

const SAMPLE_LEADERBOARD = [
  { name: "ผู้ใจดี", total: 5200 },
  { name: "แฟนคลับ", total: 3100 },
  { name: "NongGamer", total: 1500 },
];

export function AlertSettingsForm({
  plan,
  settings,
  overlayUrl,
}: {
  plan: Plan;
  settings: AlertSettings | null;
  overlayUrl: string;
}) {
  const elite = planAllows(plan, "elite");
  // Cosmetic editing is now Elite-only (Free uses the default look + watermark).
  // `pro` is kept as an alias so the per-section gating below stays readable.
  const pro = elite;
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [replay, setReplay] = useState(0);

  const { control, handleSubmit } = useForm<AlertSettingsValues>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      animation: settings?.animation ?? "slide",
      durationMs: Number(settings?.duration_ms ?? 7000),
      accentColor: settings?.accent_color ?? "#dc2626",
      textColor: settings?.text_color ?? "#ffffff",
      font: (settings?.font as AlertSettingsValues["font"]) ?? "Rajdhani",
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
      memberAlert: settings?.member_alert ?? false,
      goalEnabled: settings?.goal_enabled ?? false,
      goalTitle: settings?.goal_title ?? "",
      goalAmount: Number(settings?.goal_amount ?? 0),
      goalPeriodDays: Number(settings?.goal_period_days ?? 0),
      mediaEnabled: settings?.media_enabled ?? false,
      mediaMinAmount: Number(settings?.media_min_amount ?? 100),
      mediaMaxSeconds: Number(settings?.media_max_seconds ?? 30),
      variants: Array.isArray(settings?.variants)
        ? (settings.variants as unknown as AlertSettingsValues["variants"])
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
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
      className="grid gap-6 lg:grid-cols-5"
    >
      <div className="space-y-6 lg:col-span-3">
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
          <p className="text-xs text-muted-foreground">
            ตำแหน่งบนจอปรับได้เองใน OBS โดยลาก Browser Source ไปวางตรงไหนก็ได้
          </p>
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
          <Row label="ฟอนต์">
            <Controller
              control={control}
              name="font"
              render={({ field }) => (
                <Select
                  items={ALERT_FONTS}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange(
                      (val as AlertSettingsValues["font"]) ?? "Rajdhani"
                    )
                  }
                  disabled={!pro}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_FONTS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
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

        {/* Members — all plans */}
        <Section title="สมาชิก">
          <Row label="แจ้งเตือนเมื่อมีสมาชิกใหม่ขึ้นจอ">
            <Controller
              control={control}
              name="memberAlert"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c)}
                />
              )}
            />
          </Row>
          <p className="text-xs text-muted-foreground">
            เมื่อมีคนสมัครเป็นสมาชิกผ่านเพจ จะเด้งแจ้งเตือนบน overlay
            เหมือนการโดเนท
          </p>
        </Section>

        {/* Donation goal — Elite */}
        <Section
          title="เป้าหมายโดเนท (Elite)"
          locked={!elite}
          lockLabel="อัปเกรดเป็นอีลิท"
        >
          <Row label="เปิดใช้งานเป้าหมาย">
            <Controller
              control={control}
              name="goalEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c)}
                  disabled={!elite}
                />
              )}
            />
          </Row>
          <Row label="ชื่อเป้าหมาย">
            <Controller
              control={control}
              name="goalTitle"
              render={({ field }) => (
                <Input
                  placeholder="เช่น เป้าหมายเดือนนี้"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!elite}
                />
              )}
            />
          </Row>
          <Row label="ยอดเป้าหมาย (฿)">
            <Controller
              control={control}
              name="goalAmount"
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
                  disabled={!elite}
                />
              )}
            />
          </Row>
          <Row label="ช่วงเวลาของเป้าหมาย">
            <Controller
              control={control}
              name="goalPeriodDays"
              render={({ field }) => (
                <Select
                  items={GOAL_PERIODS}
                  value={String(field.value)}
                  onValueChange={(val) => field.onChange(Number(val ?? 0))}
                  disabled={!elite}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_PERIODS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              นับยอดโดเนทเฉพาะในช่วงที่เลือก (ย้อนหลังจากวันนี้)
            </p>
          </Row>
        </Section>

        {/* Media share — Elite */}
        <Section
          title="แชร์มีเดีย (Elite)"
          locked={!elite}
          lockLabel="อัปเกรดเป็นอีลิท"
        >
          <Row label="ให้ผู้โดเนทแนบ GIF ขึ้นจอ">
            <Controller
              control={control}
              name="mediaEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c)}
                  disabled={!elite}
                />
              )}
            />
          </Row>
          <Row label="ยอดขั้นต่ำที่แนบมีเดียได้ (฿)">
            <Controller
              control={control}
              name="mediaMinAmount"
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
                  disabled={!elite}
                />
              )}
            />
          </Row>
          <Row label={`แสดง GIF สูงสุด — ${v.mediaMaxSeconds} วินาที`}>
            <Controller
              control={control}
              name="mediaMaxSeconds"
              render={({ field }) => (
                <Slider
                  min={5}
                  max={120}
                  step={5}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange(Array.isArray(val) ? val[0] : val)
                  }
                  disabled={!elite}
                />
              )}
            />
          </Row>
        </Section>

        {/* Amount-tier variants — Elite */}
        <Section
          title="สไตล์แจ้งเตือนหลายแบบ (ตามยอด)"
          locked={!elite}
          lockLabel="อัปเกรดเป็นอีลิท"
        >
          <p className="text-xs text-muted-foreground">
            ตั้งสไตล์ต่างกันตามยอดโดเนท — ระบบเลือกระดับสูงสุดที่ยอดถึง (สูงสุด 5
            ระดับ)
          </p>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีระดับ</p>
          ) : (
            <div className="space-y-3">
              {fields.map((f, index) => (
                <div
                  key={f.id}
                  className="space-y-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      ระดับ {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={!elite}
                      aria-label="ลบระดับ"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="ยอดตั้งแต่ (฿)">
                      <Controller
                        control={control}
                        name={`variants.${index}.minAmount`}
                        render={({ field }) => (
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            disabled={!elite}
                          />
                        )}
                      />
                    </Row>
                    <Row label="อนิเมชัน">
                      <Controller
                        control={control}
                        name={`variants.${index}.animation`}
                        render={({ field }) => (
                          <Select
                            items={ANIMATIONS}
                            value={field.value}
                            onValueChange={(val) =>
                              field.onChange((val as AlertAnimation) ?? "slide")
                            }
                            disabled={!elite}
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
                  </div>
                  <Row label="สีหลัก">
                    <Controller
                      control={control}
                      name={`variants.${index}.accentColor`}
                      render={({ field }) => (
                        <ColorInput
                          value={field.value}
                          onChange={field.onChange}
                          disabled={!elite}
                        />
                      )}
                    />
                  </Row>
                  <Row label="รูป / GIF (ลิงก์ — เว้นว่างได้)">
                    <Controller
                      control={control}
                      name={`variants.${index}.imageUrl`}
                      render={({ field }) => (
                        <Input
                          placeholder="https://…"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={!elite}
                        />
                      )}
                    />
                  </Row>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!elite || fields.length >= 5}
            onClick={() =>
              append({
                minAmount: 100,
                accentColor: "#dc2626",
                imageUrl: "",
                animation: "zoom",
              })
            }
          >
            <Plus className="size-4" /> เพิ่มระดับ
          </Button>
        </Section>
      </div>

      {/* Previews + actions — right column */}
      <div className="lg:col-span-2">
        <div className="space-y-3 lg:sticky lg:top-6">
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">ตัวอย่างการแจ้งเตือน</p>
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
                      fontFamily={fontFamily(v.font)}
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

          {/* Goal preview */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">ตัวอย่างแถบเป้าหมาย</p>
                {!elite ? <UpgradeBadge /> : null}
              </div>
              <div className={cn(!elite && "opacity-60")}>
                <GoalBar
                  title={v.goalTitle || "เป้าหมายโดเนท"}
                  total={Math.round((v.goalAmount || 0) * 0.65)}
                  goalAmount={v.goalAmount || 0}
                  accentColor={v.accentColor}
                />
              </div>
              <UrlRow label="Overlay เป้าหมาย (Elite)" url={`${overlayUrl}/goal`} />
            </CardContent>
          </Card>

          {/* Leaderboard preview */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">ตัวอย่างลีดเดอร์บอร์ด</p>
                {!elite ? <UpgradeBadge /> : null}
              </div>
              <div className={cn(!elite && "opacity-60")}>
                <LeaderboardCard
                  accentColor={v.accentColor}
                  entries={SAMPLE_LEADERBOARD}
                />
              </div>
              <UrlRow
                label="Overlay ลีดเดอร์บอร์ด (Elite)"
                url={`${overlayUrl}/leaderboard`}
              />
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
  lockLabel = "อัปเกรดเป็นโปร",
  children,
}: {
  title: string;
  locked?: boolean;
  lockLabel?: string;
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
                <Lock className="size-3" /> {lockLabel}
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

function UpgradeBadge() {
  return (
    <Link href="/dashboard/billing">
      <Badge variant="outline" className="gap-1">
        <Lock className="size-3" /> อัปเกรดเป็นอีลิท
      </Badge>
    </Link>
  );
}

function UrlRow({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-input/30 px-2.5 font-mono text-xs text-muted-foreground outline-none"
        />
        <CopyButton value={url} />
      </div>
    </div>
  );
}
