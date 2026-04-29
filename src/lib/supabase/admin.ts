import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Supabase admin client — uses the service role key.
 *
 * THIS CLIENT BYPASSES ROW LEVEL SECURITY (RLS).
 *
 * Use ONLY for:
 * - Server-side administrative operations (payment verification, role assignment)
 * - Background jobs and webhook handlers
 * - Certificate generation
 * - Audit log writes that must succeed regardless of user context
 *
 * NEVER:
 * - Import this in Client Components
 * - Expose SUPABASE_SERVICE_ROLE_KEY to the browser
 * - Use this for regular user data reads/writes (use the server client instead)
 *
 * The client is instantiated once per module load (singleton pattern).
 * Route Handlers and Server Actions that need admin access import this directly.
 *
 * Usage:
 *   import { adminClient } from "@/lib/supabase/admin";
 *   const { data } = await adminClient.from("payments").update({ status: "verified" }).eq("id", id);
 */

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "This is required for admin operations. " +
      "Check your .env.local file."
  );
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not set. Check your .env.local file."
  );
}

export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      /**
       * Disable automatic session persistence for the admin client.
       * It is a server-only singleton and must never manage user sessions.
       */
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);
