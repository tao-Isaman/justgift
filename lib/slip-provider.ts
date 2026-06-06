import "server-only";
import { inquireSlip, parseTransTimestamp } from "@/lib/rdcw";
import { thunderConfigured, thunderInquireSlip } from "@/lib/thunder";
import type { InquiryResult } from "@/lib/rdcw";

// Provider-agnostic slip verification with failover.
//
// Order: Thunder first (if THUNDER_API_KEY is set). If Thunder errors for ANY
// reason (network, quota, can't read, provider down), fall back to RDCW. Both
// return the same `InquiryResult` shape, so callers don't care which ran.
//
// Note: failover triggers only on a *provider* failure. A successful provider
// response that fails the downstream receiver/amount/freshness checks is a real
// result, not a provider error, so it does not fall back.

export { parseTransTimestamp };
export type { InquiryResult };

function rdcwConfigured(): boolean {
  return Boolean(process.env.RDCW_CLIENT_ID && process.env.RDCW_CLIENT_SECRET);
}

export async function verifySlip(payload: string): Promise<InquiryResult> {
  if (thunderConfigured()) {
    const primary = await thunderInquireSlip(payload);
    if (primary.ok) return primary;

    // Thunder failed — fall back to RDCW when it's configured.
    if (rdcwConfigured()) {
      console.warn(
        `[slip] Thunder failed (${primary.message}); falling back to RDCW`
      );
      return inquireSlip(payload);
    }
    return primary;
  }

  // Thunder not configured → RDCW only.
  return inquireSlip(payload);
}
