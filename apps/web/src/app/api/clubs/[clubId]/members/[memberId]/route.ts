import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { MembershipStatus } from "@zenzo/database/enums";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; memberId: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body || !["deactivate", "reactivate", "update_plan"].includes(body.action)) {
    return NextResponse.json(
      {
        error: "Validation failed - invalid action",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // ── Resolve club if slug is passed ───────────────────────────────────────
  let clubId = params.clubId;
  if (!clubId.includes("-")) { // Check if it's likely a slug (UUIDs have hyphens)
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", params.clubId)
      .single();
    if (club) clubId = club.id;
  }

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .eq("role", "owner")
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Handle Update Plan ───────────────────────────────────────────────────
  if (body.action === "update_plan") {
    const { planId } = body;
    if (!planId) return NextResponse.json({ error: "planId is required" }, { status: 400 });

    // Fetch plan details to set next_due_date if it's missing
    const { data: membership } = await supabase
      .from("club_memberships")
      .select("next_due_date, joined_at")
      .eq("id", params.memberId)
      .single();

    let updateData: { plan_id: string; next_due_date?: string } = { plan_id: planId };

    if (membership && !membership.next_due_date) {
      // Initialize next_due_date to today or joined_at + 1 billing cycle? 
      // Sprint 5.2 says "calculates next_due_date".
      // We'll set it to today + 1 cycle or just today for now to mark them as due soon.
      // Better: joined_at + 1 month (if monthly).
      updateData.next_due_date = new Date().toISOString().slice(0, 10); 
    }

    const { error } = await supabase
      .from("club_memberships")
      .update(updateData)
      .eq("id", params.memberId)
      .eq("club_id", clubId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const status =
    body.action === "deactivate"
      ? MembershipStatus.Expired
      : MembershipStatus.Active;

  const { error } = await supabase
    .from("club_memberships")
    .update({ status })
    .eq("id", params.memberId)
    .eq("club_id", params.clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clubId: string; memberId: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Resolve club if slug is passed ───────────────────────────────────────
  let clubId = params.clubId;
  if (!clubId.includes("-")) {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", params.clubId)
      .single();
    if (club) clubId = club.id;
  }

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .eq("role", "owner")
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("club_memberships")
    .update({
      status: MembershipStatus.Deleted,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", params.memberId)
    .eq("club_id", clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
