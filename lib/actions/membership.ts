"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastToOverlay } from "@/lib/supabase/broadcast";
import { verifySlip, parseTransTimestamp } from "@/lib/slip-provider";
import { MAX_SLIP_AGE_MS, receiverMatches } from "@/lib/slip-verify";
import { membershipTierSchema, type MembershipTierValues } from "@/lib/validations";
import type { Json } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Tier management (streamer-owned; RLS enforces ownership via the user client).
// ---------------------------------------------------------------------------
export async function saveTier(
  input: MembershipTierValues & { id?: string; active?: boolean }
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = membershipTierSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };

  const perks = v.perks.map((p) => p.trim()).filter(Boolean);

  if (input.id) {
    const { error } = await supabase
      .from("membership_tiers")
      .update({
        name: v.name,
        price: v.price,
        days: v.days,
        color: v.color,
        perks,
        active: input.active ?? true,
      })
      .eq("id", input.id)
      .eq("streamer_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { count } = await supabase
      .from("membership_tiers")
      .select("id", { count: "exact", head: true })
      .eq("streamer_id", user.id);
    if ((count ?? 0) >= 5) {
      return { error: "มีระดับสมาชิกได้สูงสุด 5 ระดับ" };
    }
    const { error } = await supabase.from("membership_tiers").insert({
      streamer_id: user.id,
      name: v.name,
      price: v.price,
      days: v.days,
      color: v.color,
      perks,
      sort: count ?? 0,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/members");
  return { ok: true };
}

export async function deleteTier(
  id: string
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };

  const { error } = await supabase
    .from("membership_tiers")
    .delete()
    .eq("id", id)
    .eq("streamer_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/members");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Join / renew a membership by uploading a verified transfer slip.
// Verify-only: the money goes straight to the streamer (no custody), mirroring
// the donation flow. The viewer must be signed in (so we can track membership).
// ---------------------------------------------------------------------------
export type RedeemMembershipInput = {
  username: string;
  tierId: string;
  payload: string; // slip QR payload decoded client-side
  slipImagePath?: string;
};

export type RedeemMembershipResult = {
  ok?: true;
  tierName?: string;
  periodEnd?: string;
  error?: string;
};

export async function redeemMembershipSlip(
  input: RedeemMembershipInput
): Promise<RedeemMembershipResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนสมัครสมาชิก" };
  if (!input.payload) {
    return { error: "อ่าน QR บนสลิปไม่ได้ กรุณาอัปโหลดรูปที่ชัดกว่านี้" };
  }

  const admin = createAdminClient();

  const { data: streamer } = await admin
    .from("profiles")
    .select("id, receiver_name, promptpay_id, bank_account, overlay_token")
    .eq("username", input.username)
    .single();
  if (!streamer) return { error: "ไม่พบสตรีมเมอร์" };
  if (streamer.id === user.id) {
    return { error: "สมัครสมาชิกช่องของตัวเองไม่ได้" };
  }

  const { data: tier } = await admin
    .from("membership_tiers")
    .select("*")
    .eq("id", input.tierId)
    .eq("streamer_id", streamer.id)
    .single();
  if (!tier || !tier.active) return { error: "ไม่พบระดับสมาชิกนี้" };

  const { data: memberProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const memberName =
    memberProfile?.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "สมาชิก";

  // 1) Verify the slip against the bank (Thunder first, RDCW fallback).
  const result = await verifySlip(input.payload);
  if (!result.ok) return { error: result.message };
  const data = result.data;

  // 2) Amount from the slip must cover the tier price.
  const verifiedAmount = Number(data.amount ?? 0);
  if (!verifiedAmount || verifiedAmount <= 0) {
    return { error: "อ่านยอดเงินจากสลิปไม่ได้" };
  }
  if (verifiedAmount + 0.01 < Number(tier.price)) {
    return { error: `ยอดโอนต้องไม่น้อยกว่าค่าสมาชิก ฿${tier.price}` };
  }

  // 3) Receiver must be this streamer.
  if (!receiverMatches(streamer, data)) {
    return { error: "สลิปนี้ไม่ได้โอนเข้าบัญชีของสตรีมเมอร์" };
  }

  // 4) Reject stale slips.
  const ts = parseTransTimestamp(data);
  if (ts && Date.now() - ts.getTime() > MAX_SLIP_AGE_MS) {
    return { error: "สลิปนี้เก่าเกินไป กรุณาโอนใหม่" };
  }

  const transRef = data.transRef ?? null;

  // 5) Cross-table replay guard: a slip already used as a donation can't also
  //    buy a membership (membership_payments has its own UNIQUE on slip_trans_ref).
  if (transRef) {
    const { data: dupDonation } = await admin
      .from("donations")
      .select("id")
      .eq("slip_trans_ref", transRef)
      .maybeSingle();
    if (dupDonation) return { error: "สลิปนี้ถูกใช้ไปแล้ว" };
  }

  // 6) Record the payment (UNIQUE slip_trans_ref blocks reuse).
  const { error: insErr } = await admin.from("membership_payments").insert({
    streamer_id: streamer.id,
    member_id: user.id,
    tier_id: tier.id,
    tier_name: tier.name,
    member_name: memberName,
    amount: verifiedAmount,
    days: tier.days,
    slip_trans_ref: transRef,
    sender_name: data.sender?.displayName || data.sender?.name || null,
    sender_bank: data.sendingBank ?? null,
    receiver_account:
      data.receiver?.account?.value || data.receiver?.proxy?.value || null,
    slip_image_path: input.slipImagePath ?? null,
    slip_data: result.raw as Json,
  });
  if (insErr) {
    if (insErr.code === "23505") return { error: "สลิปนี้ถูกใช้ไปแล้ว" };
    return { error: "บันทึกการสมัครไม่สำเร็จ กรุณาลองใหม่" };
  }

  // 7) Grant / extend the membership period.
  const { data: newEnd, error: rpcErr } = await admin.rpc("grant_membership", {
    p_streamer: streamer.id,
    p_member: user.id,
    p_member_name: memberName,
    p_tier: tier.id,
    p_tier_name: tier.name,
    p_days: tier.days,
    p_amount: verifiedAmount,
  });
  if (rpcErr) return { error: "เปิดใช้งานสมาชิกไม่สำเร็จ กรุณาติดต่อสตรีมเมอร์" };

  // 8) Optional on-stream "new member" alert (best-effort).
  try {
    const { data: settings } = await admin
      .from("alert_settings")
      .select(
        "member_alert, accent_color, text_color, duration_ms, animation, sound_url, tts_enabled, tts_voice"
      )
      .eq("profile_id", streamer.id)
      .single();
    if (settings?.member_alert) {
      await broadcastToOverlay(streamer.overlay_token, {
        id: crypto.randomUUID(),
        donorName: memberName,
        amount: verifiedAmount,
        message: `เป็นสมาชิกระดับ ${tier.name} แล้ว! 🎉`,
        accentColor: tier.color || settings.accent_color,
        textColor: settings.text_color,
        durationMs: settings.duration_ms,
        animation: settings.animation,
        soundUrl: settings.sound_url,
        ttsEnabled: settings.tts_enabled,
        ttsVoice: settings.tts_voice,
      });
    }
  } catch {
    // swallow — membership is already active
  }

  revalidatePath("/memberships");
  return {
    ok: true,
    tierName: tier.name,
    periodEnd: typeof newEnd === "string" ? newEnd : undefined,
  };
}
