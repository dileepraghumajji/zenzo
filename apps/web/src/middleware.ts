// ─── Zenzo Middleware ─────────────────────────────────────────────────────────
//
// Responsibility: Session validation ONLY. No DB queries.
//
// The middleware runs on the Edge Runtime — it has no access to Supabase DB.
// It can only inspect the session cookie (JWT decode — no network call).
//
// What this middleware does:
//   1. Refreshes the Supabase auth token if it's close to expiry (cookie rotation).
//   2. Unauthenticated user on a protected route → redirect /login.
//
// What this middleware does NOT do:
//   - Fetch user profile or role (no DB access in Edge Runtime).
//   - Redirect logged-in users away from /login (the login page handles post-auth
//     redirect once the user verifies OTP and we know their tenant slug).
//   - Check tenant membership (that's the dashboard layout's job).
//
// Post-login flow (NOT in middleware):
//   Login page → verifyOtp() → POST /api/auth/profile → get tenantSlug
//   → router.push("/${tenantSlug}/dashboard")

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/onboarding",    // page handles its own auth redirect
  "/auth/",         // Supabase auth callbacks (e.g. /auth/reset-password)
  "/api/",          // let API routes handle their own auth and return JSON
  "/m/",            // member portal (token-gated, not session-gated)
  "/checkin",       // QR code attendance check-in (token-gated, no session needed)
  "/u/",            // public member profiles
  "/coaches/",      // public coach profiles
  "/clubs/",        // public club pages
];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/onboarding/interests")) return false;
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

// Routes that require authentication (dashboard routes match /:tenantSlug/*)
function isDashboardPath(pathname: string): boolean {
  // Match /something/something — at least two segments means a tenant route
  return /^\/[^/]+\//.test(pathname) || pathname.startsWith("/discover") || pathname.startsWith("/portal") || pathname.startsWith("/profile") || pathname.startsWith("/explore");
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Create an SSR Supabase client that reads + writes cookies on the request/response.
  // This is the ONLY place cookies can be set in the Next.js request lifecycle.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          // Write to request first (for downstream middleware)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate the response with the updated request
          supabaseResponse = NextResponse.next({ request });
          // Write to response (sent back to browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() validates the JWT. Do NOT use getSession() here —
  // it trusts the cookie without server-side validation (security risk).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user trying to access a dashboard route → send to login
  if (!user && isDashboardPath(pathname) && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Preserve the intended destination so login can redirect back
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Return the (possibly cookie-refreshed) response
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
