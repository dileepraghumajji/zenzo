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

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", params.clubId)
    .eq("role", "owner")
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!body || (body.action !== "deactivate" && body.action !== "reactivate")) {
    return NextResponse.json(
      {
        error: "Validation failed - invalid action",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
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

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", params.clubId)
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
    .eq("club_id", params.clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
