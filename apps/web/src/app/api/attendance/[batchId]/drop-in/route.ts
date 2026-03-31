// GET /api/attendance/[batchId]/drop-in?phone=&clubSlug=&date=
//
// Searches for a club member by phone who is NOT already in this batch.
// Used by the "Add Drop-in" dialog on the take-attendance screen.
// Returns { membershipId, userId, fullName, phone } on success.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipStatus } from "@zenzo/database/enums";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone    = searchParams.get("phone")?.trim();
  const clubSlug = searchParams.get("clubSlug")?.trim();
  const date     = searchParams.get("date")?.trim();

  if (!phone || !clubSlug || !date) {
    return NextResponse.json({ error: "phone, clubSlug, and date are required" }, { status: 400 });
  }

  // Resolve club
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  // Find user by phone
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, full_name, phone")
    .eq("phone", phone)
    .single();

  if (!targetUser) return NextResponse.json({ error: "No Zenzo account found with this phone number." }, { status: 404 });

  // Find active membership in this club
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("id, status")
    .eq("club_id", club.id)
    .eq("user_id", targetUser.id)
    .in("status", [MembershipStatus.Active, MembershipStatus.Overdue])
    .is("deleted_at", null)
    .single();

  if (!membership) return NextResponse.json({ error: "This person is not an active member of this club." }, { status: 404 });

  return NextResponse.json({
    membershipId: membership.id,
    userId:       targetUser.id,
    fullName:     targetUser.full_name,
    phone:        targetUser.phone,
  });
}
