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
  const { name, city, phone, business_type } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Club name is required." }, { status: 400 });
  }

  if (business_type && !VALID_CATEGORIES.has(business_type)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  // Resolve club — param may be UUID or slug
  const isUuid = /^[0-9a-f-]{36}$/i.test(params.clubId);
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
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

  const { error } = await supabase
    .from("clubs")
    .update({
      name:          name.trim(),
      city:          city?.trim() || null,
      phone:         phone?.trim() || null,
      business_type: business_type ?? undefined,
    })
    .eq("id", club.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
