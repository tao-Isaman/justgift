// PromptPay QR — Bank of Thailand / EMVCo QR payload builder. Pure (no deps),
// safe on server + client. The resulting string is what a banking app reads
// when it scans the QR; render it with any QR encoder.
//
// Spec refs: EMVCo Merchant-Presented QR + BOT PromptPay (AID A000000677010111).

/** TLV field: id + 2-digit length + value. */
function field(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), 4 upper-hex chars. */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Build a PromptPay payload for a phone number, national/tax ID, or e-wallet ID.
 * Pass an amount for a fixed-amount (dynamic) QR; omit it for a reusable QR
 * where the payer types the amount. Returns "" if the id is unusable.
 */
export function promptPayPayload(id: string, amount?: number): string {
  const target = (id || "").replace(/\D/g, "");
  if (target.length < 9) return "";

  const subId = target.length >= 15 ? "03" : target.length >= 13 ? "02" : "01";
  // Phone: drop leading 0, prefix country code 66, left-pad to 13.
  const formatted =
    subId === "01"
      ? ("0000000000000" + target.replace(/^0/, "66")).slice(-13)
      : target;

  const merchant =
    field("00", "A000000677010111") + field(subId, formatted);
  const dynamic = typeof amount === "number" && amount > 0;

  const body =
    field("00", "01") +
    field("01", dynamic ? "12" : "11") +
    field("29", merchant) +
    field("53", "764") +
    (dynamic ? field("54", amount.toFixed(2)) : "") +
    field("58", "TH");

  return body + "6304" + crc16(body + "6304");
}
