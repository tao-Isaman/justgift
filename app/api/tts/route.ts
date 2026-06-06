import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for text-to-speech audio. The overlay plays this as a
 * normal <audio> source, which works inside OBS (CEF has no Web Speech voices).
 * Proxying server-side (with a browser User-Agent) avoids the cross-origin /
 * bot-blocking issues of hitting the TTS endpoint directly from the browser.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") || "").slice(0, 200);
  const lang = (searchParams.get("lang") || "th").slice(0, 5);
  if (!text) return new NextResponse("missing text", { status: 400 });

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
    lang
  )}&q=${encodeURIComponent(text)}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
      cache: "no-store",
    });
  } catch {
    return new NextResponse("tts upstream unreachable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("tts upstream error", { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
