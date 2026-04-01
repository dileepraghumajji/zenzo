// DELETE /api/clubs/[clubId]/staff/[staffId]
//
// Removes a coach from the club.
// Cannot remove an owner or yourself.
//
// Returns: { success: true }

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveClub } from "@/lib/resolve-club";
import { apiResponse } from "@/lib/api-response";
import { StaffRole } from "@zenzo/database/enums";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { clubId: string; staffId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiResponse.unauthorized();

  // Resolve club
  const resolved = await resolveClub(supabase, params.clubId);
  if (!resolved) return apiResponse.notFound("Club not found.");
  const { clubId } = resolved;

  // Caller must be owner
  const { data: callerStaff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .eq("role", StaffRole.Owner)
    .single();

  if (!callerStaff) return apiResponse.forbidden();

  // Fetch the staff row to remove
  const { data: targetStaff } = await supabase
    .from("club_staff")
    .select("id, role, user_id")
    .eq("id", params.staffId)
    .eq("club_id", clubId)
    .single();

  if (!targetStaff) {
    return apiResponse.notFound("Staff member not found.");
  }

  if (targetStaff.role === StaffRole.Owner) {
    return apiResponse.badRequest("Cannot remove the club owner.");
  }

  if (targetStaff.user_id === user.id) {
    return apiResponse.badRequest("Cannot remove yourself.");
  }

  const { error } = await supabase
    .from("club_staff")
    .delete()
    .eq("id", params.staffId)
    .eq("club_id", clubId);

  if (error) return apiResponse.serverError(error.message);

  return apiResponse.ok({ success: true });
}
