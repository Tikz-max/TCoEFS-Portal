import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Supabase browser client.
 *
 * Use this inside Client Components ("use client") only.
 * For Server Components, Server Actions, and Route Handlers use the server client.
 *
 * The client is memoised — calling createClient() multiple times in the same
 * browser session returns the same instance.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
