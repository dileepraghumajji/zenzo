// Supabase client for use in Server Components, Server Actions, and Route Handlers.
//
// Uses the Database generic so all query results are fully typed.
// setAll is omitted — server components are read-only (cannot set cookies).
// Token refresh on session expiry is handled by middleware, which runs on every request.

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@zenzo/database";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  // Explicit type annotation forces the non-deprecated overload (getAll/setAll)
  // over the deprecated one (get/set/remove).
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
  };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  );
}
