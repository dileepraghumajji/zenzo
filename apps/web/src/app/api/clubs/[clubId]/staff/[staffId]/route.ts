// DELETE /api/clubs/[clubId]/staff/[staffId]
//
// Removes a coach from the club.
// Cannot remove an owner or yourself.
//
// Returns: { success: true }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffRole } from "@zenzo/database/enums";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { clubId: string; staffId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Fetch the staff row to remove
  const { data: targetStaff } = await supabase
    .from("club_staff")
    .select("id, role, user_id")
    .eq("id", params.staffId)
    .eq("club_id", club.id)
    .single();

  if (!targetStaff) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  // Guard: cannot remove owner or yourself
  if (targetStaff.role === StaffRole.Owner) {
    return NextResponse.json({ error: "Cannot remove the club owner." }, { status: 400 });
  }

  if (targetStaff.user_id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself." }, { status: 400 });
  }

  const { error } = await supabase
    .from("club_staff")
    .delete()
    .eq("id", params.staffId)
    .eq("club_id", club.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
