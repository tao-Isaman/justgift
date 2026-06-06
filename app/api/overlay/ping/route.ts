import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Overlay heartbeat — marks the streamer "live" for the admin dashboard. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "no token" }, { status: 400 });
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ last_overlay_at: new Date().toISOString() })
    .eq("overlay_token", token);
  return NextResponse.json({ ok: true });
}
