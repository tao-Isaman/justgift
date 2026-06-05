import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily job (see vercel.json crons): downgrade lapsed SaaS subscriptions to
// free, and mark lapsed viewer memberships as expired.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("expire_subscriptions");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: memExpired, error: memErr } = await admin.rpc(
    "expire_memberships"
  );
  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }
  return NextResponse.json({
    expired: data ?? 0,
    memberships_expired: memExpired ?? 0,
  });
}
