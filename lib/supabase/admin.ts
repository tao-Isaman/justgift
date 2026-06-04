import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Privileged Supabase client using the service-role key. Bypasses RLS.
 * NEVER import this into client code. Use only inside Server Actions /
 * Route Handlers for trusted operations (slip verification, broadcasting).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
