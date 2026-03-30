// POST /api/onboarding/studio
//
// Step 2 of the onboarding wizard.
// Creates the club + links the owner as club_staff.
//
// Uses the admin (service-role) client for DB writes because the user has no
// club_staff rows yet, so RLS policies that check club membership would block
// the very first INSERT.
//
// Body: { business_name, slug, city, business_type }
// Returns: { clubSlug, clubId }
//
// Error codes:
//   401 — not authenticated
//   409 — slug already taken (code: "slug_taken")
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ClubCategory, StaffRole, VerificationStatus } from "@zenzo/database/enums";

type Body = {
  business_name?: string;
  slug?: string;
  city?: string;
  business_type?: string;
};

export async function POST(request: NextRequest) {
  // Auth — use the cookie-based client to verify the caller
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

  // DB writes — use the admin client (bypasses RLS)
  const admin = createSupabaseAdminClient();

  // Ensure the users row exists (handle_new_user trigger may not have fired
  // if the DB was reset after signup — auth.users persists but public.users
  // is wiped).
  await admin.from("users").upsert(
    {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? "User",
      phone: user.user_metadata?.phone ?? "",
      email: user.email ?? "",
      auth_provider: user.app_metadata?.provider ?? "email",
    },
    { onConflict: "id" }
  );


  // Check if the user already has a club (idempotency guard)
  const { data: staff } = await admin
    .from("club_staff")
    .select("club_id")
    .eq("user_id", user.id)
    .limit(1);

  if (staff && staff.length > 0) {
    // Already has a club — fetch and return it
    const { data: existing } = await admin
      .from("clubs")
      .select("id, slug")
      .eq("id", staff[0]!.club_id)
      .single();

    if (existing) {
      return NextResponse.json({
        clubSlug: existing.slug,
        clubId: existing.id,
      });
    }
  }


  // Create the club
  const { data: club, error: clubError } = await admin
    .from("clubs")
    .insert({
      slug,
      name: business_name,
      business_type: business_type as ClubCategory,
      city,
      terminology: {},
      owner_id: user.id,
      verification_status: VerificationStatus.Pending,
      listed: false,
      phone: null,
      logo_url: null,
    })
    .select("id, slug")
    .single();

  if (clubError) {
    // Postgres unique violation on slug column
    if (clubError.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: clubError.message }, { status: 500 });
  }

  // Link the user to the new club as an owner
  const { error: staffError } = await admin
    .from("club_staff")
    .insert({
      club_id: club.id,
      user_id: user.id,
      role: StaffRole.Owner,
    });

  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 500 });
  }

  return NextResponse.json({
    clubSlug: club.slug,
    clubId: club.id,
  });
}

