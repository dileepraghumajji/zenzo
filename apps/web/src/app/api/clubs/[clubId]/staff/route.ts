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

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveClub } from "@/lib/resolve-club";
import { apiResponse } from "@/lib/api-response";
import { isValidPhone, normalizePhone } from "@zenzo/utils";
import { StaffRole } from "@zenzo/database/enums";

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiResponse.unauthorized();

  const body = await request.json();
  const phone = normalizePhone(body.phone ?? "");

  if (!isValidPhone(phone)) {
    return apiResponse.badRequest("Valid 10-digit phone is required.");
  }

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

  // Look up the target user by phone
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!targetUser) {
    return apiResponse.notFound("No Zenzo account found with that phone number.");
  }

  // Check not already staff
  const { data: existing } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", targetUser.id)
    .single();

  if (existing) {
    return apiResponse.conflict("This person is already a staff member.");
  }

  // Insert coach row
  const { data: newStaff, error } = await supabase
    .from("club_staff")
    .insert({ club_id: clubId, user_id: targetUser.id, role: StaffRole.Coach })
    .select("id")
    .single();

  if (error || !newStaff) {
    return apiResponse.serverError(error?.message ?? "Failed to add coach.");
  }

  return apiResponse.ok({ staffId: newStaff.id });
}
