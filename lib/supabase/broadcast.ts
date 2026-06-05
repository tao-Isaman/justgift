import "server-only";
import type { OverlayAlertPayload } from "@/lib/supabase/types";

/**
 * Send an event to an overlay's realtime Broadcast channel via the Supabase
 * Realtime HTTP API. The channel name (`overlay:<token>`) carries the secret
 * token. Runs server-side with the service-role key — never call from client.
 */
async function send(
  token: string,
  event: string,
  payload: Record<string, unknown>
) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      messages: [{ topic: `overlay:${token}`, event, payload, private: false }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Realtime broadcast failed: ${res.status} ${text}`);
  }
}

export async function broadcastToOverlay(
  token: string,
  payload: OverlayAlertPayload
) {
  await send(token, "donation", payload as unknown as Record<string, unknown>);
}

/** Tell the overlay to skip the currently-playing media. */
export async function broadcastSkip(token: string) {
  await send(token, "skip", {});
}
