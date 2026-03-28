// POST /api/auth/profile
//
// Called by the login page AFTER Supabase signInWithPassword() succeeds.
// Returns the user's tenant slug + role so the login page can redirect to
// /:tenantSlug/dashboard.
//
// Why a route handler and not a server action?
// The login page is a client component (handles form input + submission).
// Client components can't call server-only code directly. This is the bridge.
//
// Flow:
//   1. Login page: supabase.auth.signInWithPassword() → session cookie set
//   2. Login page: POST /api/auth/profile
//   3. This handler: reads session → queries profiles + tenants → {tenantSlug, role}
//   4. Login page: router.push("/${tenantSlug}/dashboard")

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // tenant_id is null for users who haven't completed onboarding
  if (!profile.tenant_id) {
    return NextResponse.json({ error: "Onboarding incomplete" }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", profile.tenant_id)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    tenantSlug: tenant.slug,
    role: profile.role,
  });
}
