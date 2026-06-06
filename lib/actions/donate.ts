"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastToOverlay } from "@/lib/supabase/broadcast";
import { verifySlip, parseTransTimestamp } from "@/lib/slip-provider";
import { MAX_SLIP_AGE_MS, receiverMatches } from "@/lib/slip-verify";
import { donationSchema } from "@/lib/validations";
import { PLAN_DONATION_LIMIT, effectivePlan } from "@/lib/constants";
import { parseYouTubeId, youTubeEmbedUrl } from "@/lib/media";
import type { AlertVariant, Json } from "@/lib/supabase/types";

export type SubmitDonationInput = {
  username: string;
  donorName: string;
  message?: string;
  amount: number;
  payload: string; // QR payload decoded client-side
  slipImagePath?: string;
  mediaUrl?: string;
};

export type SubmitDonationResult = { ok?: true; amount?: number; error?: string };

export async function submitDonation(
  input: SubmitDonationInput
): Promise<SubmitDonationResult> {
  const parsed = donationSchema.safeParse({
    donorName: input.donorName,
    message: input.message,
    amount: input.amount,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  if (!input.payload) {
    return {
      error: "อ่าน QR บนสลิปไม่ได้ กรุณาอัปโหลดรูปที่ชัดกว่านี้",
    };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, overlay_token, receiver_name, promptpay_id, bank_account, plan, plan_expires_at"
    )
    .eq("username", input.username)
    .single();
  if (!profile) return { error: "ไม่พบสตรีมเมอร์" };

  const { data: settings } = await admin
    .from("alert_settings")
    .select("*")
    .eq("profile_id", profile.id)
    .single();
  const minAmount = Number(settings?.min_amount ?? 1);

  // Monthly receive cap by plan. Currently unlimited for all plans, so this
  // block is a no-op; kept so a soft cap can be reintroduced via PLAN_DONATION_LIMIT.
  const limit =
    PLAN_DONATION_LIMIT[effectivePlan(profile.plan, profile.plan_expires_at)];
  if (Number.isFinite(limit)) {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    ).toISOString();
    const { count } = await admin
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("status", "verified")
      .gte("created_at", monthStart);
    if ((count ?? 0) >= limit) {
      return {
        error: "เดือนนี้สตรีมเมอร์รับโดเนทครบจำนวนแล้ว กรุณาลองใหม่เดือนหน้า",
      };
    }
  }

  // 1) Verify the slip against the bank via RDCW.
  const result = await verifySlip(input.payload);
  if (!result.ok) return { error: result.message };
  const data = result.data;

  // 2) Amount is taken from the slip (source of truth), not the donor's claim.
  const verifiedAmount = Number(data.amount ?? 0);
  if (!verifiedAmount || verifiedAmount <= 0) {
    return { error: "อ่านยอดเงินจากสลิปไม่ได้" };
  }
  if (verifiedAmount < minAmount) {
    return { error: `ยอดโดเนทขั้นต่ำของสตรีมเมอร์คือ ฿${minAmount}` };
  }

  // 3) Receiver must be this streamer.
  if (!receiverMatches(profile, data)) {
    return {
      error: "สลิปนี้ไม่ได้โอนเข้าบัญชีของสตรีมเมอร์",
    };
  }

  // 4) Reject obviously stale slips (best-effort; skipped if unparseable).
  const ts = parseTransTimestamp(data);
  if (ts && Date.now() - ts.getTime() > MAX_SLIP_AGE_MS) {
    return { error: "สลิปนี้เก่าเกินไป กรุณาโดเนทด้วยการโอนล่าสุด" };
  }

  // 4b) Pick the amount-tier variant (highest minAmount <= verifiedAmount).
  const variants = Array.isArray(settings?.variants)
    ? (settings.variants as unknown as AlertVariant[])
    : [];
  const variant = variants
    .filter((vv) => Number(vv?.minAmount) <= verifiedAmount)
    .sort((a, b) => Number(b.minAmount) - Number(a.minAmount))[0];

  const accentColor = variant?.accentColor || settings?.accent_color;
  const imageUrl = variant?.imageUrl || settings?.image_url;
  const animation = variant?.animation || settings?.animation;

  // 4c) Optional YouTube media, gated by the streamer's settings + amount.
  let mediaEmbed: string | null = null;
  let mediaSeconds: number | undefined;
  const mediaId = parseYouTubeId(input.mediaUrl);
  if (
    settings?.media_enabled &&
    mediaId &&
    verifiedAmount >= Number(settings?.media_min_amount ?? 100)
  ) {
    mediaEmbed = youTubeEmbedUrl(mediaId);
    mediaSeconds = Number(settings?.media_max_seconds ?? 30);
  }

  // 5) Insert — the UNIQUE constraint on slip_trans_ref blocks slip reuse.
  const { data: inserted, error: insErr } = await admin
    .from("donations")
    .insert({
      profile_id: profile.id,
      donor_name: parsed.data.donorName,
      message: parsed.data.message ?? null,
      amount: parsed.data.amount,
      verified_amount: verifiedAmount,
      status: "verified",
      slip_trans_ref: data.transRef ?? null,
      sender_name: data.sender?.displayName || data.sender?.name || null,
      sender_bank: data.sendingBank ?? null,
      receiver_account:
        data.receiver?.account?.value || data.receiver?.proxy?.value || null,
      slip_image_path: input.slipImagePath ?? null,
      media_url: mediaEmbed ? input.mediaUrl?.trim() ?? null : null,
      slip_data: result.raw as Json,
    })
    .select("id")
    .single();

  if (insErr) {
    if (insErr.code === "23505") {
      return { error: "สลิปนี้ถูกใช้โดเนทไปแล้ว" };
    }
    return { error: "บันทึกโดเนทไม่สำเร็จ กรุณาลองใหม่" };
  }

  // 6) Fire the on-stream alert (best-effort — donation is already recorded).
  try {
    await broadcastToOverlay(profile.overlay_token, {
      id: inserted.id,
      donorName: parsed.data.donorName,
      amount: verifiedAmount,
      message: parsed.data.message ?? null,
      accentColor,
      textColor: settings?.text_color,
      imageUrl,
      durationMs: settings?.duration_ms,
      ttsEnabled: settings?.tts_enabled,
      ttsVoice: settings?.tts_voice,
      animation,
      soundUrl: settings?.sound_url,
      mediaUrl: mediaEmbed,
      mediaSeconds,
    });
  } catch {
    // swallow — the streamer can replay from history later
  }

  return { ok: true, amount: verifiedAmount };
}
