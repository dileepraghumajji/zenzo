import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveClub } from "@/lib/resolve-club";
import { apiResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { MembershipStatus, StaffRole } from "@zenzo/database/enums";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; memberId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return apiResponse.unauthorized();

  const body = await request.json();

  if (!body || !["deactivate", "reactivate", "update_plan", "update_batch"].includes(body.action)) {
    return apiResponse.badRequest("Validation failed - invalid action.");
  }

  // ── Resolve club ──────────────────────────────────────────────────────────
  const resolved = await resolveClub(supabase, params.clubId);
  if (!resolved) return apiResponse.notFound("Club not found.");
  const { clubId } = resolved;

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .eq("role", StaffRole.Owner)
    .single();

  if (!staff) return apiResponse.forbidden();

  // ── Handle Update Plan ───────────────────────────────────────────────────
  if (body.action === "update_plan") {
    const { planId } = body;
    if (!planId) return apiResponse.badRequest("planId is required.");

    const { data: membership } = await supabase
      .from("club_memberships")
      .select("next_due_date, joined_at")
      .eq("id", params.memberId)
      .single();

    let updateData: { plan_id: string; next_due_date?: string } = { plan_id: planId };

    if (membership && !membership.next_due_date) {
      updateData.next_due_date = new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase
      .from("club_memberships")
      .update(updateData)
      .eq("id", params.memberId)
      .eq("club_id", clubId);

    if (error) return apiResponse.serverError(error.message);
    return apiResponse.ok({ success: true });
  }

  // ── Handle Update Batch ──────────────────────────────────────────────────
  if (body.action === "update_batch") {
    const { batchId } = body;
    if (!batchId) return apiResponse.badRequest("batchId is required.");

    await supabase
      .from("member_batches")
      .delete()
      .eq("membership_id", params.memberId);

    const { error: insertError } = await supabase
      .from("member_batches")
      .insert({ membership_id: params.memberId, batch_id: batchId });

    if (insertError) return apiResponse.serverError(insertError.message);
    return apiResponse.ok({ success: true });
  }

  const status =
    body.action === "deactivate"
      ? MembershipStatus.Expired
      : MembershipStatus.Active;

  const { error } = await supabase
    .from("club_memberships")
    .update({ status })
    .eq("id", params.memberId)
    .eq("club_id", clubId);

  if (error) return apiResponse.serverError(error.message);

  return apiResponse.ok({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { clubId: string; memberId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return apiResponse.unauthorized();

  // ── Resolve club ──────────────────────────────────────────────────────────
  const resolved = await resolveClub(supabase, params.clubId);
  if (!resolved) return apiResponse.notFound("Club not found.");
  const { clubId } = resolved;

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .eq("role", StaffRole.Owner)
    .single();

  if (!staff) return apiResponse.forbidden();

  const { error } = await supabase
    .from("club_memberships")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.memberId)
    .eq("club_id", clubId);

  if (error) return apiResponse.serverError(error.message);

  return apiResponse.ok({ success: true });
}
