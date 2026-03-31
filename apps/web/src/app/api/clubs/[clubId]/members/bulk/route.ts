// POST /api/clubs/[clubId]/members/bulk
//
// Bulk action on a list of membership IDs.
// Owner-only.
//
// Body: { action: "deactivate" | "delete", membershipIds: string[] }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipStatus, StaffRole } from "@zenzo/database/enums";

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, membershipIds } = body as {
    action: string;
    membershipIds: string[];
  };

  if (!["deactivate", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
    return NextResponse.json({ error: "membershipIds must be a non-empty array" }, { status: 400 });
  }

  // Resolve club (accepts UUID or slug)
  const isUuid = /^[0-9a-f-]{36}$/i.test(params.clubId);
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq(isUuid ? "id" : "slug", params.clubId)
    .single();

  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  // Caller must be owner
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .eq("role", StaffRole.Owner)
    .single();

  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "deactivate") {
    const { error } = await supabase
      .from("club_memberships")
      .update({ status: MembershipStatus.Expired })
      .in("id", membershipIds)
      .eq("club_id", club.id)
      .is("deleted_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("club_memberships")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", membershipIds)
      .eq("club_id", club.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: membershipIds.length });
}
