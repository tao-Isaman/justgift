import "server-only";
import type { InquiryResult, RdcwData, RdcwParty } from "@/lib/rdcw";

// Thunder Solution Slip Verify — https://document.thunder.in.th/th/v2
// POST https://api.thunder.in.th/v2/verify/bank  body: { payload }
// Auth: Bearer <THUNDER_API_KEY>
// Response: { success, data: { rawSlip: {...}, ... }, message }
// Errors: { success:false, code, message } — VALIDATION_ERROR / SLIP_NOT_FOUND /
//         QUOTA_EXCEEDED.
//
// Mapped into the same `InquiryResult` / `RdcwData` shape as the RDCW client so
// the donation + membership flows stay provider-agnostic.

const DEFAULT_BASE = "https://api.thunder.in.th/v2";

function endpoint(): string {
  const base = process.env.THUNDER_API_URL?.replace(/\/+$/, "") || DEFAULT_BASE;
  return `${base}/verify/bank`;
}

export function thunderConfigured(): boolean {
  return Boolean(process.env.THUNDER_API_KEY);
}

/** Thunder masks an ISO date (e.g. 2024-01-15T14:30:00+07:00); split it into
 *  the YYYYMMDD / HHMMSS strings RDCW's parseTransTimestamp expects. */
function isoToTransParts(iso?: string): {
  transDate?: string;
  transTime?: string;
} {
  if (!iso) return {};
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(iso);
  if (!m) return {};
  return {
    transDate: `${m[1]}${m[2]}${m[3]}`,
    transTime: `${m[4]}${m[5]}${m[6]}`,
  };
}

type ThunderParty = {
  bank?: { id?: string; name?: string; short?: string };
  account?: {
    name?: { th?: string; en?: string };
    bank?: { type?: string; account?: string };
    proxy?: { type?: string; account?: string };
  };
};

function mapParty(p?: ThunderParty): RdcwParty {
  const acc = p?.account;
  return {
    displayName: acc?.name?.th ?? acc?.name?.en ?? null,
    name: acc?.name?.en ?? acc?.name?.th ?? null,
    account: { type: acc?.bank?.type ?? null, value: acc?.bank?.account ?? null },
    proxy: acc?.proxy
      ? { type: acc.proxy.type ?? null, value: acc.proxy.account ?? null }
      : null,
  };
}

function messageForError(code?: string, fallback?: string): string {
  switch (code) {
    case "QUOTA_EXCEEDED":
      return "โควต้าการตรวจสลิปเต็มแล้ว กรุณาลองใหม่ภายหลัง";
    case "VALIDATION_ERROR":
      return "อ่านสลิปนี้ไม่ได้ กรุณาอัปโหลดรูปสลิปโอนเงินต้นฉบับ";
    case "SLIP_NOT_FOUND":
      return "ตรวจสอบสลิปนี้ว่าเป็นการชำระเงินจริงไม่ได้";
    default:
      return fallback ?? "ตรวจสอบสลิปนี้ไม่ได้";
  }
}

export async function thunderInquireSlip(
  payload: string
): Promise<InquiryResult> {
  const key = process.env.THUNDER_API_KEY;
  if (!key) return { ok: false, message: "ยังไม่ได้ตั้งค่าการตรวจสลิป" };

  let res: Response;
  try {
    res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ payload }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "เชื่อมต่อบริการตรวจสลิปไม่ได้ กรุณาลองใหม่" };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response
  }

  const obj = (body ?? {}) as Record<string, unknown>;

  if (!res.ok || obj.success !== true) {
    const code = typeof obj.code === "string" ? obj.code : undefined;
    const msg = typeof obj.message === "string" ? obj.message : undefined;
    return { ok: false, message: messageForError(code, msg) };
  }

  const data = (obj.data ?? {}) as Record<string, unknown>;
  const rs = (data.rawSlip ?? {}) as Record<string, unknown>;
  if (!rs.transRef) {
    return {
      ok: false,
      message: "ตรวจสอบสลิปนี้ว่าเป็นการชำระเงินจริงไม่ได้",
    };
  }

  const amountObj = rs.amount as { amount?: number } | undefined;
  const sender = rs.sender as ThunderParty | undefined;
  const receiver = rs.receiver as ThunderParty | undefined;

  const mapped: RdcwData = {
    transRef: String(rs.transRef),
    amount:
      amountObj?.amount ??
      (typeof data.amountInSlip === "number" ? data.amountInSlip : undefined),
    sendingBank: sender?.bank?.short ?? sender?.bank?.id,
    receivingBank: receiver?.bank?.short ?? receiver?.bank?.id,
    ref1: typeof rs.ref1 === "string" ? rs.ref1 : undefined,
    ref2: typeof rs.ref2 === "string" ? rs.ref2 : undefined,
    ref3: typeof rs.ref3 === "string" ? rs.ref3 : undefined,
    countryCode: typeof rs.countryCode === "string" ? rs.countryCode : undefined,
    sender: mapParty(sender),
    receiver: mapParty(receiver),
    ...isoToTransParts(typeof rs.date === "string" ? rs.date : undefined),
  };

  return { ok: true, data: mapped, raw: body };
}
