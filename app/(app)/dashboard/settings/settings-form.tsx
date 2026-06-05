"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "@/lib/actions/profile";
import {
  profileSettingsSchema,
  type ProfileSettingsValues,
} from "@/lib/validations";
import { THAI_BANKS } from "@/lib/constants";
import { SOCIAL_PLATFORMS, asSocials } from "@/lib/social";
import { formatTHB } from "@/lib/format";
import type { Profile } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [saving, startSave] = useTransition();
  const socials = asSocials(profile.socials);

  const { control, handleSubmit } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      displayName: profile.display_name ?? "",
      bio: profile.bio ?? "",
      bannerUrl: profile.banner_url ?? "",
      accentColor: profile.accent_color ?? "",
      socials: {
        instagram: socials.instagram ?? "",
        x: socials.x ?? "",
        youtube: socials.youtube ?? "",
        tiktok: socials.tiktok ?? "",
        discord: socials.discord ?? "",
        website: socials.website ?? "",
      },
      suggestedAmounts: profile.suggested_amounts ?? [],
      showGoal: profile.show_goal ?? true,
      showLeaderboard: profile.show_leaderboard ?? true,
      receiverName: profile.receiver_name ?? "",
      promptpayId: profile.promptpay_id ?? "",
      bankName: profile.bank_name ?? "",
      bankAccount: profile.bank_account ?? "",
    },
  });

  function onSubmit(values: ProfileSettingsValues) {
    startSave(async () => {
      const res = await updateProfile(values);
      if (res?.error) toast.error(res.error);
      else toast.success("บันทึกโปรไฟล์แล้ว");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile */}
      <Section title="โปรไฟล์">
        <p className="text-xs text-muted-foreground">
          ลิงก์เพจของคุณคือ{" "}
          <span className="font-mono text-foreground">
            /{profile.username}
          </span>{" "}
          (เปลี่ยนชื่อผู้ใช้ไม่ได้)
        </p>
        <Row label="ชื่อที่แสดง">
          <Controller
            control={control}
            name="displayName"
            render={({ field, fieldState }) => (
              <Field error={fieldState.error?.message}>
                <Input placeholder="ชื่อช่องของคุณ" {...field} />
              </Field>
            )}
          />
        </Row>
        <Row label="แนะนำตัว (bio)">
          <Controller
            control={control}
            name="bio"
            render={({ field, fieldState }) => (
              <Field error={fieldState.error?.message}>
                <Textarea
                  placeholder="เล่าเกี่ยวกับช่องของคุณสั้น ๆ"
                  rows={3}
                  {...field}
                />
              </Field>
            )}
          />
        </Row>
        <Row label="รูปแบนเนอร์ (ลิงก์)">
          <Controller
            control={control}
            name="bannerUrl"
            render={({ field, fieldState }) => (
              <Field error={fieldState.error?.message}>
                <Input placeholder="https://… (รูปกว้าง ~1500×500)" {...field} />
                {field.value ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={field.value}
                    alt=""
                    className="mt-2 h-24 w-full rounded-lg border border-border/60 object-cover"
                  />
                ) : null}
              </Field>
            )}
          />
        </Row>
        <Row label="สีธีมเพจ">
          <Controller
            control={control}
            name="accentColor"
            render={({ field, fieldState }) => (
              <Field error={fieldState.error?.message}>
                <ColorInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="เว้นว่าง = สีแดงเริ่มต้น"
                />
              </Field>
            )}
          />
        </Row>
      </Section>

      {/* Socials */}
      <Section title="ลิงก์โซเชียล">
        <p className="text-xs text-muted-foreground">
          วางลิงก์โปรไฟล์ของคุณ (เว้นว่างได้)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <Row key={p.key} label={p.label}>
              <Controller
                control={control}
                name={`socials.${p.key}`}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                      <p.icon className="size-4" />
                    </span>
                    <Input placeholder="https://…" {...field} />
                  </div>
                )}
              />
            </Row>
          ))}
        </div>
      </Section>

      {/* Donation page */}
      <Section title="หน้าเพจรับโดเนท">
        <Row label="ยอดโดเนทแนะนำ (ปุ่มลัด)">
          <Controller
            control={control}
            name="suggestedAmounts"
            render={({ field }) => (
              <AmountsEditor value={field.value} onChange={field.onChange} />
            )}
          />
        </Row>
        <ToggleRow
          label="แสดงแถบเป้าหมายบนเพจ"
          hint="ดึงจากการตั้งค่าเป้าหมายในหน้าการแจ้งเตือน (Elite)"
        >
          <Controller
            control={control}
            name="showGoal"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(c) => field.onChange(c)}
              />
            )}
          />
        </ToggleRow>
        <ToggleRow
          label="แสดงลีดเดอร์บอร์ดบนเพจ"
          hint="ผู้โดเนทสูงสุดของเดือนนี้"
        >
          <Controller
            control={control}
            name="showLeaderboard"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(c) => field.onChange(c)}
              />
            )}
          />
        </ToggleRow>
      </Section>

      {/* Payout account */}
      <Section title="บัญชีรับเงิน">
        <p className="text-xs text-muted-foreground">
          ใช้จับคู่กับสลิปของผู้โดเนท/สมาชิก เพื่อยืนยันว่าเงินเข้าบัญชีคุณจริง
        </p>
        <Row label="ชื่อบัญชีผู้รับเงิน">
          <Controller
            control={control}
            name="receiverName"
            render={({ field, fieldState }) => (
              <Field error={fieldState.error?.message}>
                <Input placeholder="ชื่อบนบัญชี / พร้อมเพย์ของคุณ" {...field} />
              </Field>
            )}
          />
        </Row>
        <Row label="พร้อมเพย์">
          <Controller
            control={control}
            name="promptpayId"
            render={({ field, fieldState }) => (
              <Field error={fieldState.error?.message}>
                <Input
                  placeholder="เบอร์โทร หรือเลขบัตรประชาชน"
                  inputMode="numeric"
                  {...field}
                />
              </Field>
            )}
          />
        </Row>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="ธนาคาร">
            <Controller
              control={control}
              name="bankName"
              render={({ field }) => (
                <Select
                  items={THAI_BANKS}
                  value={field.value || null}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกธนาคาร…" />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_BANKS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Row>
          <Row label="เลขที่บัญชี">
            <Controller
              control={control}
              name="bankAccount"
              render={({ field }) => (
                <Input
                  placeholder="xxx-x-xxxxx-x"
                  inputMode="numeric"
                  {...field}
                />
              )}
            />
          </Row>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" className="glow-red-sm" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          บันทึก
        </Button>
      </div>
    </form>
  );
}

function AmountsEditor({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const n = Math.round(Number(draft));
    if (!Number.isFinite(n) || n <= 0) return;
    if (value.includes(n) || value.length >= 6) {
      setDraft("");
      return;
    }
    onChange([...value, n].sort((a, b) => a - b));
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            ยังไม่มี — เพิ่มยอดแนะนำเพื่อให้ผู้โดเนทกดเลือกได้เร็วขึ้น
          </span>
        ) : (
          value.map((n) => (
            <Badge key={n} variant="outline" className="gap-1 py-1 pr-1 pl-2.5">
              {formatTHB(n)}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== n))}
                className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`ลบ ${n}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="เช่น 100"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="max-w-40"
          disabled={value.length >= 6}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={value.length >= 6 || !draft}
        >
          <Plus className="size-4" /> เพิ่ม
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <div className="space-y-4">{children}</div>
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

function ToggleRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{label}</Label>
        {hint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#dc2626"}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent",
          !value && "opacity-60"
        )}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
    </div>
  );
}
