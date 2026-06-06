import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, tiktokConfigured } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Start the TikTok OAuth flow (admin only). */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  if (!tiktokConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/tiktok?error=not_configured", appUrl)
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/admin/tiktok", appUrl));
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.redirect(new URL("/admin/tiktok?error=forbidden", appUrl));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
