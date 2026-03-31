// POST /api/clubs
//
// Canonical club creation endpoint.
// Creates a clubs row + club_staff row (role: owner).
//
// Used when an authenticated owner creates a new club (second club, etc.).
// First-time onboarding uses /api/onboarding/studio which additionally
// upserts the users row before calling the same insert logic.
//
// Body: { name, slug, business_type, city? }
// Returns: { clubSlug, clubId }
//
// Error codes:
//   400 — missing or invalid fields
//   401 — not authenticated
//   409 — slug already taken
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ClubCategory, StaffRole, VerificationStatus } from "@zenzo/database/enums";

type Body = {
  name?: string;
  slug?: string;
  business_type?: string;
  city?: string | null;
};

export async function POST(request: NextRequest) {
  // Verify caller — cookie-based client
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const name          = body.name?.trim() ?? "";
  const slug          = body.slug?.trim().toLowerCase() ?? "";
  const city          = body.city?.trim() || null;
  const business_type = body.business_type?.trim() || "gym";

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must contain only lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  // DB writes use the admin client (bypasses RLS — user has no club_staff row yet)
  const admin = createSupabaseAdminClient();

  const { data: club, error: clubError } = await admin
    .from("clubs")
    .insert({
      slug,
      name,
      business_type: business_type as ClubCategory,
      city,
      terminology: {},
      owner_id: user.id,
      verification_status: VerificationStatus.Pending,
      listed: false,
      phone: null,
      logo_url: null,
      description: null,
    })
    .select("id, slug")
    .single();

  if (clubError) {
    if (clubError.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: clubError.message }, { status: 500 });
  }

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
