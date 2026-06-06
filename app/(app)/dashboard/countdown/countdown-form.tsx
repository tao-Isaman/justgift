"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Pause, Play, Plus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/dashboard/copy-button";
import { nowMs } from "@/lib/format";
import {
  saveCountdownConfig,
  startCountdown,
  pauseCountdown,
  resumeCountdown,
  addCountdownMinutes,
  resetCountdown,
} from "@/lib/actions/countdown";

type Initial = {
  enabled: boolean;
  running: boolean;
  endsAt: string | null;
  remainingMs: number;
  bahtPerUnit: number;
  minutesPerUnit: number;
};

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function CountdownForm({
  initial,
  overlayUrl,
}: {
  initial: Initial;
  overlayUrl: string;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [bahtPerUnit, setBahtPerUnit] = useState(initial.bahtPerUnit);
  const [minutesPerUnit, setMinutesPerUnit] = useState(initial.minutesPerUnit);
  const [startMinutes, setStartMinutes] = useState(10);
  const [pending, start] = useTransition();

  // Live preview ticking off the server-provided state (refreshes on action).
  const [now, setNow] = useState(() => nowMs());
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMs()), 500);
    return () => window.clearInterval(id);
  }, []);
  const remaining =
    initial.running && initial.endsAt
      ? new Date(initial.endsAt).getTime() - now
      : initial.remainingMs;

  function run(fn: () => Promise<{ error?: string; ok?: boolean }>, msg: string) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(msg);
    });
  }

  return (
    <div className="space-y-6">
      {/* Live state */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">เวลาที่เหลือ</p>
              <p className="font-display text-4xl font-extrabold tabular-nums">
                {fmt(remaining)}
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: initial.running
                  ? "rgb(34 197 94 / 0.15)"
                  : "rgb(148 163 184 / 0.15)",
                color: initial.running ? "#4ade80" : "#94a3b8",
              }}
            >
              {initial.running ? "กำลังนับ" : "หยุดชั่วคราว"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={1}
              value={startMinutes}
              onChange={(e) => setStartMinutes(Number(e.target.value) || 0)}
              className="w-24"
            />
            <Button
              disabled={pending}
              onClick={() =>
                run(() => startCountdown(startMinutes), "เริ่มจับเวลาแล้ว")
              }
            >
              <Play className="size-4" /> เริ่มใหม่
            </Button>
            {initial.running ? (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(pauseCountdown, "หยุดชั่วคราวแล้ว")}
              >
                <Pause className="size-4" /> หยุด
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(resumeCountdown, "เล่นต่อแล้ว")}
              >
                <Play className="size-4" /> เล่นต่อ
              </Button>
            )}
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run(() => addCountdownMinutes(1), "เพิ่ม 1 นาที")}
            >
              <Plus className="size-4" /> 1 นาที
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run(() => addCountdownMinutes(5), "เพิ่ม 5 นาที")}
            >
              <Plus className="size-4" /> 5 นาที
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => run(resetCountdown, "รีเซ็ตแล้ว")}
            >
              <RotateCcw className="size-4" /> รีเซ็ต
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Config */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-heading text-base font-semibold">ตั้งค่า</h3>
          <div className="flex items-center justify-between gap-4">
            <Label>เปิดใช้งานตัวจับเวลา</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-2">
            <Label>อัตราเพิ่มเวลาเมื่อมีโดเนท</Label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>ทุก ฿</span>
              <Input
                type="number"
                min={1}
                value={bahtPerUnit}
                onChange={(e) => setBahtPerUnit(Number(e.target.value) || 0)}
                className="w-24"
              />
              <span>เพิ่ม</span>
              <Input
                type="number"
                min={0.1}
                step={0.5}
                value={minutesPerUnit}
                onChange={(e) => setMinutesPerUnit(Number(e.target.value) || 0)}
                className="w-24"
              />
              <span>นาที</span>
            </div>
            <p className="text-xs text-muted-foreground">
              เช่น ทุก ฿10 = 1 นาที → โดเนท ฿50 จะเพิ่มเวลา 5 นาที
            </p>
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  saveCountdownConfig({ enabled, bahtPerUnit, minutesPerUnit }),
                "บันทึกการตั้งค่าแล้ว"
              )
            }
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            บันทึก
          </Button>
        </CardContent>
      </Card>

      {/* Overlay URL */}
      <Card>
        <CardContent className="space-y-2">
          <h3 className="font-heading text-base font-semibold">
            ลิงก์ Overlay นับถอยหลัง
          </h3>
          <p className="text-xs text-muted-foreground">
            วางเป็น Browser Source ใน OBS
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs">
              {overlayUrl}
            </span>
            <CopyButton value={overlayUrl} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
