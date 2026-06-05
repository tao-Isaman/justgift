"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Uploads an image to the public `public-media` bucket (under the user's own
 * folder) and returns its public URL via onChange. Used for avatar + banner.
 */
export function ImageUpload({
  value,
  onChange,
  userId,
  kind,
}: {
  value: string;
  onChange: (url: string) => void;
  userId: string;
  kind: "avatar" | "banner";
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAvatar = kind === "avatar";

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("ไฟล์ต้องเป็นรูปภาพ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${userId}/${kind}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("public-media")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (error) {
        toast.error(`อัปโหลดไม่สำเร็จ: ${error.message}`);
        return;
      }
      const { data } = supabase.storage.from("public-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("อัปโหลดรูปแล้ว");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex gap-4",
        isAvatar ? "items-center" : "flex-col items-stretch"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden border border-border/60 bg-muted/30",
          isAvatar ? "size-20 rounded-full" : "h-28 w-full rounded-lg"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImageUp className="size-6" />
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageUp className="size-4" />
          )}
          {value ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            disabled={uploading}
          >
            <X className="size-4" /> ลบ
          </Button>
        ) : null}
      </div>
    </div>
  );
}
