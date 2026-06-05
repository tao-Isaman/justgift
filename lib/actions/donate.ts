"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastToOverlay } from "@/lib/supabase/broadcast";
import { inquireSlip, parseTransTimestamp, type RdcwData } from "@/lib/rdcw";
import { donationSchema } from "@/lib/validations";
import type { Json } from "@/lib/supabase/types";

export type SubmitDonationInput = {
  username: string;
  donorName: string;
  message?: string;
  amount: number;
  payload: string; // QR payload decoded client-side
  slipImagePath?: string;
};

export type SubmitDonationResult = { ok?: true; amount?: number; error?: string };

const MAX_SLIP_AGE_MS = 24 * 60 * 60 * 1000;

function digitsTail(value: string | null | undefined, n = 4): string {
  return (value ?? "").replace(/\D/g, "").slice(-n);
}

/**
 * Verify that the slip was actually paid to THIS streamer. Thai slips mask the
 * receiver, so we match on the last digits of the account/proxy OR overlapping
 * name tokens. Fails closed when there's no usable signal.
 */
function receiverMatches(
  profile: {
    receiver_name: string | null;
    promptpay_id: string | null;
    bank_account: string | null;
  },
  data: RdcwData
): boolean {
  const recv = data.receiver ?? {};
  const slipAcct = digitsTail(recv.account?.value ?? recv.proxy?.value);
  const targetAcct =
    digitsTail(profile.bank_account) || digitsTail(profile.promptpay_id);
  if (slipAcct && targetAcct && slipAcct === targetAcct) return true;

  const slipName = (recv.displayName || recv.name || "").toLowerCase();
  if (profile.receiver_name && slipName) {
    const tokens = profile.receiver_name
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 3);
    if (tokens.some((t) => slipName.includes(t))) return true;
  }

  return false;
}

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
    .select("id, overlay_token, receiver_name, promptpay_id, bank_account")
    .eq("username", input.username)
    .single();
  if (!profile) return { error: "ไม่พบสตรีมเมอร์" };

  const { data: settings } = await admin
    .from("alert_settings")
    .select("*")
    .eq("profile_id", profile.id)
    .single();
  const minAmount = Number(settings?.min_amount ?? 1);

  // 1) Verify the slip against the bank via RDCW.
  const result = await inquireSlip(input.payload);
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
      accentColor: settings?.accent_color,
      textColor: settings?.text_color,
      imageUrl: settings?.image_url,
      durationMs: settings?.duration_ms,
      ttsEnabled: settings?.tts_enabled,
      ttsVoice: settings?.tts_voice,
      animation: settings?.animation,
    });
  } catch {
    // swallow — the streamer can replay from history later
  }

  return { ok: true, amount: verifiedAmount };
}
