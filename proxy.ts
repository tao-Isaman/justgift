import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 "proxy" convention (formerly middleware).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - Next internals (_next/static, _next/image)
     * - favicon and common static image/font files
     * - /overlay (public OBS browser source, must stay fast & cookieless)
     */
    "/((?!_next/static|_next/image|favicon.ico|overlay|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
