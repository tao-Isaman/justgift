import "server-only";

/**
 * TikTok Content Posting API (v2) helpers — admin-only marketing integration.
 *
 * v1 uses the **inbox upload** flow (scope `video.upload`): the video lands in
 * the connected account's TikTok app inbox, where the user writes the caption
 * and taps Post. This needs NO app audit and can post publicly. Switching to
 * full auto-publish later means using the direct-post endpoint (scope
 * `video.publish`), which requires passing TikTok's app audit.
 *
 * Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
 */

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const INBOX_INIT_URL =
  "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";

export const TIKTOK_SCOPES = "user.info.basic,video.upload";

export function tiktokConfigured(): boolean {
  return Boolean(
    process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET
  );
}

function redirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/callback`;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: redirectUri(),
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export type TikTokToken = {
  open_id: string;
  scope: string;
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  refresh_expires_in: number; // seconds
  token_type: string;
};

export async function exchangeCode(code: string): Promise<TikTokToken> {
  return tokenRequest({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
  });
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TikTokToken> {
  return tokenRequest({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function tokenRequest(
  body: Record<string, string>
): Promise<TikTokToken> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  const json = (await res.json()) as TikTokToken & {
    error?: string;
    error_description?: string;
  };
  if (!res.ok || json.error) {
    throw new Error(
      json.error_description || json.error || `TikTok token error (${res.status})`
    );
  }
  return json;
}

export type InboxInit = { publishId: string; uploadUrl: string };

/**
 * Initialize an inbox upload. Returns the publish_id (to track) and a
 * pre-signed upload_url to PUT the video bytes to.
 */
export async function initInboxUpload(
  accessToken: string,
  videoSize: number
): Promise<InboxInit> {
  const res = await fetch(INBOX_INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    // Whole file in a single chunk (caller enforces the 64MB ceiling).
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    }),
    cache: "no-store",
  });
  const json = (await res.json()) as {
    data?: { publish_id: string; upload_url: string };
    error?: { code: string; message: string };
  };
  if (!res.ok || !json.data || (json.error && json.error.code !== "ok")) {
    throw new Error(json.error?.message || `TikTok init error (${res.status})`);
  }
  return { publishId: json.data.publish_id, uploadUrl: json.data.upload_url };
}

/** PUT the full video to TikTok's pre-signed URL as a single chunk. */
export async function uploadVideo(
  uploadUrl: string,
  body: Blob,
  mime: string
): Promise<void> {
  const size = body.size;
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mime,
      "Content-Length": String(size),
      "Content-Range": `bytes 0-${size - 1}/${size}`,
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`TikTok upload failed (${res.status})`);
  }
}

export const TIKTOK_MAX_BYTES = 64 * 1024 * 1024;
