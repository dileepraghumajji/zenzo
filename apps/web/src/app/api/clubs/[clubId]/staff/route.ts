// POST /api/clubs/[clubId]/staff
//
// Adds a coach to the club by phone number lookup.
// [clubId] accepts UUID or slug.
//
// Body: { phone }
// Returns: { staffId }
//
// Errors:
//   400 — invalid phone
//   403 — caller not owner
//   404 — club or user not found
//   409 — already a staff member

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffRole } from "@zenzo/database/enums";

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const phone = body.phone?.trim().replace(/\D/g, "");

  if (!phone || phone.length !== 10) {
    return NextResponse.json({ error: "Valid 10-digit phone is required." }, { status: 400 });
  }

  // Resolve club
  const isUuid = /^[0-9a-f-]{36}$/i.test(params.clubId);
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq(isUuid ? "id" : "slug", params.clubId)
    .single();

  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });

  // Caller must be owner
  const { data: callerStaff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .eq("role", StaffRole.Owner)
    .single();

  if (!callerStaff) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Look up the target user by phone
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!targetUser) {
    return NextResponse.json(
      { error: "No Zenzo account found with that phone number." },
      { status: 404 }
    );
  }

  // Check not already staff
  const { data: existing } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", targetUser.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "This person is already a staff member." },
      { status: 409 }
    );
  }

  // Insert coach row
  const { data: newStaff, error } = await supabase
    .from("club_staff")
    .insert({ club_id: club.id, user_id: targetUser.id, role: StaffRole.Coach })
    .select("id")
    .single();

  if (error || !newStaff) {
    return NextResponse.json({ error: error?.message ?? "Failed to add coach." }, { status: 500 });
  }

  return NextResponse.json({ staffId: newStaff.id });
}
