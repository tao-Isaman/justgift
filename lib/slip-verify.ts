import "server-only";
import type { RdcwData } from "@/lib/rdcw";

/** Reject slips older than this (best-effort anti-replay window). */
export const MAX_SLIP_AGE_MS = 24 * 60 * 60 * 1000;

export function digitsTail(value: string | null | undefined, n = 4): string {
  return (value ?? "").replace(/\D/g, "").slice(-n);
}

/**
 * Verify the slip was actually paid to THIS streamer's PromptPay number or bank
 * account. Thai slips mask the receiver to the last 4 digits, so we compare
 * those; the receiver name is only a fallback when no digits are available.
 * Fails closed when there's no usable signal. Shared by donations + memberships.
 */
export function receiverMatches(
  profile: {
    receiver_name: string | null;
    promptpay_id: string | null;
    bank_account: string | null;
  },
  data: RdcwData
): boolean {
  const recv = data.receiver ?? {};

  const slipTails = [recv.account?.value, recv.proxy?.value]
    .map((v) => digitsTail(v))
    .filter((t) => t.length === 4);

  const targetTails = [profile.bank_account, profile.promptpay_id]
    .map((v) => digitsTail(v))
    .filter((t) => t.length === 4);

  if (slipTails.length && targetTails.length) {
    return slipTails.some((s) => targetTails.includes(s));
  }

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
