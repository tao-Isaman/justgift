import jsQR from "jsqr";

/**
 * Decode the QR/EMV payload embedded in a Thai bank transfer slip image.
 * Runs in the browser (uses canvas) — import only from Client Components.
 * Returns the raw payload string to send to RDCW, or null if no QR was found.
 */
export async function decodeSlipQr(file: File): Promise<string | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const imageData = ctx.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, width, height, {
    inversionAttempts: "attemptBoth",
  });

  return result?.data ?? null;
}
