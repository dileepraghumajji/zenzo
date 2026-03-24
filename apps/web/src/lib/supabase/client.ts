// Supabase client for use in Client Components (browser).
//
// Rule: call createSupabaseBrowserClient() directly inside the function that
// runs queries — never pass the returned client through other helpers.
// Passing it through helpers loses the Database generic and makes query
// results resolve to `never`.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
