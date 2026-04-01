// POST /api/clubs/[clubId]/members/bulk
//
// Bulk action on a list of membership IDs.
// Owner-only.
//
// Body: { action: "deactivate" | "delete", membershipIds: string[] }

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveClub } from "@/lib/resolve-club";
import { apiResponse } from "@/lib/api-response";
import { MembershipStatus, StaffRole } from "@zenzo/database/enums";

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiResponse.unauthorized();

  const body = await request.json();
  const { action, membershipIds } = body as {
    action: string;
    membershipIds: string[];
  };

  if (!["deactivate", "delete"].includes(action)) {
    return apiResponse.badRequest("Invalid action.");
  }
  if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
    return apiResponse.badRequest("membershipIds must be a non-empty array.");
  }

  // Resolve club (accepts UUID or slug)
  const resolved = await resolveClub(supabase, params.clubId);
  if (!resolved) return apiResponse.notFound("Club not found.");
  const { clubId } = resolved;

  // Caller must be owner
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .eq("role", StaffRole.Owner)
    .single();

  if (!staff) return apiResponse.forbidden();

  if (action === "deactivate") {
    const { error } = await supabase
      .from("club_memberships")
      .update({ status: MembershipStatus.Expired })
      .in("id", membershipIds)
      .eq("club_id", clubId)
      .is("deleted_at", null);

    if (error) return apiResponse.serverError(error.message);
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("club_memberships")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", membershipIds)
      .eq("club_id", clubId);

    if (error) return apiResponse.serverError(error.message);
  }

  return apiResponse.ok({ success: true, count: membershipIds.length });
}
