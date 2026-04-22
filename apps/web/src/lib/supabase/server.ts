// Supabase clients for server-side use.
//
// createSupabaseServerClient()  — user-scoped (anon key + JWT from cookies).
//                                  Respects RLS. Use in Server Components,
//                                  Server Actions, and Route Handlers for
//                                  normal user-facing queries.
//
// createSupabaseAdminClient()   — admin-scoped (service role key, NO cookies).
//                                  Bypasses RLS. Use ONLY in Route Handlers
//                                  for bootstrapping operations (e.g. onboarding)
//                                  where the caller has already been authenticated
//                                  via getUser().

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import type { Database } from "@zenzo/database";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const requestHeaders = headers();
  const authHeader = requestHeaders.get("Authorization");

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Called from a Server Component — cookies are read-only there.
        // Middleware handles token refresh on the next request.
      }
    },
  };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
      ...(authHeader && {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }),
    }
  );
}

/**
 * Admin client that bypasses RLS.
 * Use only in Route Handlers after verifying the user via getUser().
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

