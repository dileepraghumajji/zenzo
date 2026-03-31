// PATCH /api/clubs/[clubId]/settings
//
// Updates the club's business profile.
// [clubId] param accepts either a UUID or a slug.
//
// Body: { name, city?, phone?, business_type }
// Returns: { success: true }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClubCategory, StaffRole } from "@zenzo/database/enums";

const VALID_CATEGORIES = new Set<string>(Object.values(ClubCategory));

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, city, phone, business_type, logo_url, terminology_patch } = body;

  // At least one meaningful field must be present
  if (!name && logo_url === undefined && !terminology_patch) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "Club name is required." }, { status: 400 });
  }

  if (business_type && !VALID_CATEGORIES.has(business_type)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  // Resolve club — param may be UUID or slug
  const isUuid = /^[0-9a-f-]{36}$/i.test(params.clubId);
  const { data: club } = await supabase
    .from("clubs")
    .select("id, terminology")
    .eq(isUuid ? "id" : "slug", params.clubId)
    .single();

  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });

  // Caller must be owner
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .eq("role", StaffRole.Owner)
    .single();

  if (!staff) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Build update payload
  type ClubUpdate = {
    name?: string;
    city?: string | null;
    phone?: string | null;
    business_type?: string;
    logo_url?: string | null;
    terminology?: Record<string, unknown>;
  };

  const update: ClubUpdate = {};

  if (name)          update.name          = name.trim();
  if (city !== undefined)  update.city    = city?.trim() || null;
  if (phone !== undefined) update.phone   = phone?.trim() || null;
  if (business_type) update.business_type = business_type;
  if (logo_url !== undefined) update.logo_url = logo_url;

  // Merge terminology_patch into existing terminology JSON
  if (terminology_patch && typeof terminology_patch === "object") {
    const existing = (club.terminology ?? {}) as Record<string, unknown>;
    update.terminology = { ...existing, ...terminology_patch };
  }

  const { error } = await supabase
    .from("clubs")
    .update(update)
    .eq("id", club.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
