import "server-only";

// RDCW Slip Verify — https://slip.rdcw.co.th/docs
// POST https://suba.rdcw.co.th/v2/inquiry  body: { payload }
// Auth: Basic base64(clientId:clientSecret)
// Errors: HTTP 400 with { code, message }.

const RDCW_ENDPOINT = "https://suba.rdcw.co.th/v2/inquiry";

export type RdcwAccount = { type?: string | null; value?: string | null };
export type RdcwProxy = { type?: string | null; value?: string | null };
export type RdcwParty = {
  displayName?: string | null;
  name?: string | null;
  account?: RdcwAccount | null;
  proxy?: RdcwProxy | null;
};

export type RdcwData = {
  transRef?: string;
  transDate?: string;
  transTime?: string;
  sendingBank?: string;
  receivingBank?: string;
  amount?: number;
  ref1?: string;
  ref2?: string;
  ref3?: string;
  sender?: RdcwParty;
  receiver?: RdcwParty;
  countryCode?: string;
};

export type InquiryResult =
  | { ok: true; data: RdcwData; raw: unknown }
  | { ok: false; code?: number; message: string };

function messageForCode(code?: number, fallback?: string): string {
  if (code === 1007) return "Slip verification quota exceeded. Please try again later.";
  if (code === 1008) return "Slip verification subscription has expired.";
  if (code === 1003) return "Slip verification isn't allowed from this server.";
  if (code !== undefined && code >= 1000 && code <= 1002)
    return "Slip verification isn't configured correctly.";
  if (code !== undefined && code >= 1004 && code <= 1006)
    return "We couldn't read this slip. Please upload the original transfer slip image.";
  if (code !== undefined && code >= 2000 && code <= 2999)
    return "The bank couldn't verify this slip right now. Please try again.";
  return fallback ?? "This slip could not be verified.";
}

export async function inquireSlip(payload: string): Promise<InquiryResult> {
  const id = process.env.RDCW_CLIENT_ID;
  const secret = process.env.RDCW_CLIENT_SECRET;
  if (!id || !secret) {
    return { ok: false, message: "Slip verification isn't configured yet." };
  }

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");

  let res: Response;
  try {
    res = await fetch(RDCW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ payload }),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the verification service. Please try again.",
    };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response
  }

  const obj = (body ?? {}) as Record<string, unknown>;

  // Error envelope (RDCW returns 400 with { code, message }).
  if (!res.ok || typeof obj.code === "number") {
    const code = typeof obj.code === "number" ? obj.code : undefined;
    const msg = typeof obj.message === "string" ? obj.message : undefined;
    return { ok: false, code, message: messageForCode(code, msg) };
  }

  if (obj.valid !== true || typeof obj.data !== "object" || obj.data === null) {
    return { ok: false, message: "This slip could not be verified as a real payment." };
  }

  return { ok: true, data: obj.data as RdcwData, raw: body };
}

/** Best-effort transaction timestamp from RDCW transDate/transTime (Thai time). */
export function parseTransTimestamp(data: RdcwData): Date | null {
  const date = (data.transDate ?? "").replace(/\D/g, ""); // YYYYMMDD
  if (date.length !== 8) return null;
  const time = (data.transTime ?? "").replace(/\D/g, "").padEnd(6, "0"); // HHMMSS
  const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(
    0,
    2
  )}:${time.slice(2, 4)}:${time.slice(4, 6)}+07:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
