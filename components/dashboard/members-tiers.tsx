"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { saveTier, deleteTier } from "@/lib/actions/membership";
import { formatTHB } from "@/lib/format";
import type { MembershipTier } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Draft = {
  id?: string;
  name: string;
  price: string;
  days: string;
  color: string;
  perks: string[];
  active: boolean;
};

const EMPTY: Draft = {
  name: "",
  price: "",
  days: "30",
  color: "#dc2626",
  perks: [],
  active: true,
};

export function MembersTiers({ tiers }: { tiers: MembershipTier[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, startSave] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openNew() {
    setDraft({ ...EMPTY });
  }
  function openEdit(t: MembershipTier) {
    setDraft({
      id: t.id,
      name: t.name,
      price: String(t.price),
      days: String(t.days),
      color: t.color,
      perks: t.perks ?? [],
      active: t.active,
    });
  }

  function save() {
    if (!draft) return;
    startSave(async () => {
      const res = await saveTier({
        id: draft.id,
        name: draft.name,
        price: Number(draft.price),
        days: Number(draft.days),
        color: draft.color,
        perks: draft.perks,
        active: draft.active,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกระดับสมาชิกแล้ว");
      setDraft(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    setDeletingId(id);
    startSave(async () => {
      const res = await deleteTier(id);
      setDeletingId(null);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("ลบระดับแล้ว");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {tiers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
          ยังไม่มีระดับสมาชิก — สร้างระดับแรกเพื่อให้ผู้ชมสมัครเป็นสมาชิกได้
        </p>
      ) : (
        <ul className="space-y-2">
          {tiers.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{t.name}</span>
                  {!t.active ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      ปิดอยู่
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTHB(Number(t.price))} / {t.days} วัน
                  {t.perks.length ? ` · ${t.perks.length} สิทธิประโยชน์` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => openEdit(t)}
                aria-label="แก้ไข"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(t.id)}
                disabled={saving && deletingId === t.id}
                aria-label="ลบ"
              >
                {saving && deletingId === t.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={openNew}
        disabled={tiers.length >= 5}
      >
        <Plus className="size-4" /> เพิ่มระดับสมาชิก
        {tiers.length >= 5 ? " (สูงสุด 5)" : ""}
      </Button>

      <Dialog open={!!draft} onOpenChange={(o) => (o ? null : setDraft(null))}>
        <DialogContent className="sm:max-w-md">
          {draft ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {draft.id ? "แก้ไขระดับสมาชิก" : "ระดับสมาชิกใหม่"}
                </DialogTitle>
                <DialogDescription>
                  ผู้สมัครโอนตามราคานี้ไปยังบัญชีของคุณโดยตรง แล้วอัปโหลดสลิป
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Field label="ชื่อระดับ">
                  <Input
                    placeholder="เช่น Bronze / แฟนคลับ"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ราคา (฿)">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={draft.price}
                      onChange={(e) =>
                        setDraft({ ...draft, price: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="ระยะเวลา (วัน)">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={draft.days}
                      onChange={(e) =>
                        setDraft({ ...draft, days: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field label="สีระดับ">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.color}
                      onChange={(e) =>
                        setDraft({ ...draft, color: e.target.value })
                      }
                      className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
                    />
                    <Input
                      value={draft.color}
                      onChange={(e) =>
                        setDraft({ ...draft, color: e.target.value })
                      }
                      className="font-mono"
                    />
                  </div>
                </Field>
                <Field label="สิทธิประโยชน์">
                  <PerksEditor
                    value={draft.perks}
                    onChange={(perks) => setDraft({ ...draft, perks })}
                  />
                </Field>
                {draft.id ? (
                  <div className="flex items-center justify-between">
                    <Label>เปิดให้สมัคร</Label>
                    <Switch
                      checked={draft.active}
                      onCheckedChange={(c) => setDraft({ ...draft, active: c })}
                    />
                  </div>
                ) : null}

                <Button
                  type="button"
                  className="w-full"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  บันทึก
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PerksEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const t = draft.trim();
    if (!t || value.includes(t) || value.length >= 8) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  }
  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <ul className="space-y-1">
          {value.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-sm"
            >
              <Check className="size-3.5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{p}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== p))}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`ลบ ${p}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          placeholder="เช่น ป้ายสมาชิกบนแชท"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          disabled={value.length >= 8}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={value.length >= 8 || !draft.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
