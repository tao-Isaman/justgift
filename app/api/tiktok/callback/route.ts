import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCode } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/** TikTok OAuth redirect target — exchanges the code and stores the connection. */
export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/admin/tiktok?error=${encodeURIComponent(reason)}`, appUrl)
    );

  if (oauthError) return fail(oauthError);

  // Verify CSRF state and consume the cookie.
  const cookieStore = await cookies();
  const savedState = cookieStore.get("tiktok_oauth_state")?.value;
  cookieStore.delete("tiktok_oauth_state");
  if (!code || !state || !savedState || state !== savedState) {
    return fail("state");
  }

  // Re-check admin on the callback too.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl));
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return fail("forbidden");

  try {
    const token = await exchangeCode(code);
    const now = Date.now();
    const admin = createAdminClient();

    // Single brand connection: clear any existing row, then insert the new one.
    await admin.from("tiktok_connection").delete().neq("id", ZERO_UUID);
    const { error } = await admin.from("tiktok_connection").insert({
      open_id: token.open_id,
      scope: token.scope,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: new Date(now + token.expires_in * 1000).toISOString(),
      refresh_expires_at: token.refresh_expires_in
        ? new Date(now + token.refresh_expires_in * 1000).toISOString()
        : null,
    });
    if (error) return fail("store");

    return NextResponse.redirect(new URL("/admin/tiktok?connected=1", appUrl));
  } catch {
    return fail("token");
  }
}
