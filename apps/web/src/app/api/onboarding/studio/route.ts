// POST /api/onboarding/studio
//
// Step 2 of the onboarding wizard.
// Creates the tenant + updates the owner's profile.tenant_id.
//
// Body: { business_name, slug, city, business_type }
// Returns: { tenantSlug, tenantId }
//
// Error codes:
//   401 — not authenticated
//   409 — slug already taken (code: "slug_taken")
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TenantPlan, UserRole } from "@zenzo/database/enums";

type Body = {
  business_name?: string;
  slug?: string;
  city?: string;
  business_type?: string;
};

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const business_name = body.business_name?.trim() ?? "";
  const slug         = body.slug?.trim().toLowerCase() ?? "";
  const city         = body.city?.trim() || null;
  const business_type = body.business_type?.trim() || "gym";

  if (!business_name || !slug) {
    return NextResponse.json(
      { error: "business_name and slug are required" },
      { status: 400 }
    );
  }

  // Check if the profile already has a tenant (idempotency guard)
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profile?.tenant_id) {
    // Already has a tenant — fetch and return it
    const { data: existing } = await supabase
      .from("tenants")
      .select("id, slug")
      .eq("id", profile.tenant_id)
      .single();

    if (existing) {
      return NextResponse.json({
        tenantSlug: existing.slug,
        tenantId: existing.id,
      });
    }
  }

  // Create the tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      slug,
      name: business_name,
      business_type,
      city,
      terminology: {},
      plan: TenantPlan.Trial,
    })
    .select("id, slug")
    .single();

  if (tenantError) {
    // Postgres unique violation on slug column
    if (tenantError.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  // Link the profile to the new tenant.
  // Use upsert — when email confirmation is enabled, signUp() returns no session
  // so /api/auth/signup is never called and the profiles row may not exist yet.
  // user_metadata carries full_name + phone set during signUp options.data.
  const fullName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : null;
  const phone = typeof user.user_metadata?.phone === "string"
    ? user.user_metadata.phone
    : null;

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      tenant_id: tenant.id,
      role: UserRole.Owner,
      full_name: fullName,
      phone,
      email: user.email ?? null,
    }, { onConflict: "id" });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    tenantSlug: tenant.slug,
    tenantId: tenant.id,
  });
}
