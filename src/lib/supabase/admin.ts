/**
 * WARNING: This client uses the SERVICE_ROLE key which bypasses ALL RLS policies.
 * NEVER import this file in client components or expose it to the browser.
 * Only use in: Server Components, Server Actions, API Routes.
 * Always filter queries explicitly by client_id/workspace_id — RLS won't protect you here.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must only be used server-side");
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
