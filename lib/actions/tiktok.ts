"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initInboxUpload,
  refreshAccessToken,
  uploadVideo,
  TIKTOK_MAX_BYTES,
} from "@/lib/tiktok";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

type AdminClient = ReturnType<typeof createAdminClient>;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ? user : null;
}

/** Get a non-expired access token, refreshing (and persisting) if needed. */
async function getValidAccessToken(admin: AdminClient): Promise<string | null> {
  const { data: conn } = await admin
    .from("tiktok_connection")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (!conn) return null;

  // Refresh if it expires within 60s.
  if (new Date(conn.expires_at).getTime() - Date.now() > 60_000) {
    return conn.access_token;
  }

  const now = Date.now();
  const t = await refreshAccessToken(conn.refresh_token);
  await admin
    .from("tiktok_connection")
    .update({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(now + t.expires_in * 1000).toISOString(),
      refresh_expires_at: t.refresh_expires_in
        ? new Date(now + t.refresh_expires_in * 1000).toISOString()
        : conn.refresh_expires_at,
      updated_at: new Date(now).toISOString(),
    })
    .eq("id", conn.id);
  return t.access_token;
}

/**
 * Push a staged video (already uploaded to the `tiktok-uploads` bucket) to the
 * connected account's TikTok inbox. The user finishes posting (caption +
 * publish) inside the TikTok app.
 */
export async function postVideoToTikTok(input: {
  storagePath: string;
}): Promise<{ error?: string; ok?: boolean; publishId?: string }> {
  if (!(await assertAdmin())) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const admin = createAdminClient();
  let accessToken: string | null;
  try {
    accessToken = await getValidAccessToken(admin);
  } catch {
    return { error: "โทเคน TikTok หมดอายุ — กรุณาเชื่อมต่อใหม่" };
  }
  if (!accessToken) return { error: "ยังไม่ได้เชื่อมต่อ TikTok" };

  const { data: file, error: dlErr } = await admin.storage
    .from("tiktok-uploads")
    .download(input.storagePath);
  if (dlErr || !file) return { error: "ไม่พบไฟล์วิดีโอ" };

  if (file.size > TIKTOK_MAX_BYTES) {
    return { error: "วิดีโอใหญ่เกิน 64MB" };
  }
  const mime = file.type || "video/mp4";

  try {
    const init = await initInboxUpload(accessToken, file.size);
    await uploadVideo(init.uploadUrl, file, mime);
    // Best-effort cleanup of the staged file.
    await admin.storage.from("tiktok-uploads").remove([input.storagePath]);
    return { ok: true, publishId: init.publishId };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "ส่งไป TikTok ไม่สำเร็จ",
    };
  }
}

/** Remove the stored TikTok connection. */
export async function disconnectTikTok(): Promise<{
  error?: string;
  ok?: boolean;
}> {
  if (!(await assertAdmin())) return { error: "ไม่มีสิทธิ์เข้าถึง" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("tiktok_connection")
    .delete()
    .neq("id", ZERO_UUID);
  if (error) return { error: error.message };
  revalidatePath("/admin/tiktok");
  return { ok: true };
}
