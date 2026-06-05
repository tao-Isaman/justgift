import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/admin",
  "/memberships",
];
const AUTH_ROUTES = ["/login", "/signup"];

/**
 * Refreshes the Supabase session on every request and applies coarse route
 * protection. Must return the `supabaseResponse` (or copy its cookies) so the
 * refreshed auth cookies reach the browser.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const redirectTo = (pathname: string, withNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    if (withNext) url.searchParams.set("next", path);
    const res = NextResponse.redirect(url);
    // Preserve refreshed auth cookies on the redirect response.
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    return redirectTo("/login", true);
  }

  if (user && AUTH_ROUTES.includes(path)) {
    return redirectTo("/dashboard");
  }

  return supabaseResponse;
}
