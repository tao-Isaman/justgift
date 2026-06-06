"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Loader2,
  Send,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { postVideoToTikTok, disconnectTikTok } from "@/lib/actions/tiktok";

const MAX_BYTES = 64 * 1024 * 1024;

type Connection = {
  open_id: string;
  display_name: string | null;
  scope: string | null;
  expires_at: string;
  created_at: string;
} | null;

export function TikTokPoster({
  configured,
  connection,
  userId,
}: {
  configured: boolean;
  connection: Connection;
  userId: string;
}) {
  // Surface OAuth callback results (?connected=1 / ?error=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      toast.success("เชื่อมต่อ TikTok แล้ว");
    } else if (params.get("error")) {
      toast.error(`เชื่อมต่อไม่สำเร็จ: ${params.get("error")}`);
    }
    if (params.get("connected") || params.get("error")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (!configured) {
    return (
      <Card>
        <CardContent className="space-y-2">
          <h3 className="font-heading text-base font-semibold">
            ยังไม่ได้ตั้งค่า TikTok
          </h3>
          <p className="text-sm text-muted-foreground">
            ตั้งค่า <code>TIKTOK_CLIENT_KEY</code> และ{" "}
            <code>TIKTOK_CLIENT_SECRET</code> ใน environment variables
            แล้วสร้างแอปที่ TikTok for Developers ก่อนใช้งาน
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!connection) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-heading text-base font-semibold">
              เชื่อมต่อบัญชี TikTok
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              เชื่อมต่อบัญชี TikTok ของแบรนด์เพื่อส่งวิดีโอเข้ากล่อง inbox
            </p>
          </div>
          {/* Full-page nav (not next/link) so the OAuth redirect works. */}
          <Button onClick={() => window.location.assign("/api/tiktok/auth")}>
            <Video className="size-4" /> เชื่อมต่อ TikTok
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ConnectedPanel connection={connection} userId={userId} />
  );
}

function ConnectedPanel({
  connection,
  userId,
}: {
  connection: NonNullable<Connection>;
  userId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [staged, setStaged] = useState<{ path: string; name: string } | null>(
    null
  );
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, startSend] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function stageVideo(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("ไฟล์ต้องเป็นวิดีโอ");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("วิดีโอต้องไม่เกิน 64MB");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("tiktok-uploads")
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error(`อัปโหลดไม่สำเร็จ: ${error.message}`);
        return;
      }
      setStaged({ path, name: file.name });
      toast.success("เตรียมวิดีโอแล้ว — กดส่งไป TikTok ได้เลย");
    } finally {
      setUploading(false);
    }
  }

  function send() {
    if (!staged) return;
    startSend(async () => {
      const res = await postVideoToTikTok({ storagePath: staged.path });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("ส่งไปกล่อง inbox ของ TikTok แล้ว — เปิดแอปเพื่อโพสต์");
      setStaged(null);
      setCaption("");
    });
  }

  function disconnect() {
    startDisconnect(async () => {
      const res = await disconnectTikTok();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("ยกเลิกการเชื่อมต่อ TikTok แล้ว");
      window.location.reload();
    });
  }

  async function copyCaption() {
    if (!caption.trim()) return;
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              เชื่อมต่อแล้ว
            </Badge>
            <span className="text-sm text-muted-foreground">
              {connection.display_name || connection.open_id}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
            ยกเลิกการเชื่อมต่อ
          </Button>
        </CardContent>
      </Card>

      {/* Upload + send */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-heading text-base font-semibold">ส่งวิดีโอ</h3>

          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) stageVideo(f);
              e.target.value = "";
            }}
          />

          {staged ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Video className="size-4 shrink-0 text-primary" />
                <span className="truncate">{staged.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setStaged(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="ลบวิดีโอ"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              เลือกวิดีโอ (≤ 64MB)
            </Button>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>แคปชัน (ร่างไว้คัดลอกตอนโพสต์)</Label>
              <button
                type="button"
                onClick={copyCaption}
                disabled={!caption.trim()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                คัดลอก
              </button>
            </div>
            <Textarea
              rows={3}
              placeholder="เช่น รับโดเนทไม่โดนสลิปปลอม ตรวจอัตโนมัติทุกใบ 🎁 #โดเนท #สตรีมเมอร์ #JustGift"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              TikTok กำหนดให้ใส่แคปชันในแอปตอนโพสต์ (สำหรับการส่งแบบ inbox)
              — ร่างไว้ที่นี่แล้วคัดลอกไปวางได้
            </p>
          </div>

          <Button
            onClick={send}
            disabled={!staged || sending}
            className="w-full glow-red-sm"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            ส่งไป TikTok
          </Button>
          <p className="text-xs text-muted-foreground">
            วิดีโอจะไปอยู่ในกล่องข้อความของแอป TikTok — เปิดแอป ใส่แคปชัน
            แล้วกดโพสต์ (ภายใน 7 วัน)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
