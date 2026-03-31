// POST /api/portal/invites/[id]/decline
//
// Marks a pending club_invite as expired (declined).
// Only the invitee (matched by email) can decline their own invite.
//
// Returns: { status: 'declined' }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Get the user's email
  const { data: userRow } = await admin
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify the invite belongs to this user
  const { data: invite } = await admin
    .from("club_invites")
    .select("id, status")
    .eq("id", params.id)
    .eq("email", userRow.email)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Invite already used or expired" }, { status: 409 });
  }

  await admin
    .from("club_invites")
    .update({ status: "expired" })
    .eq("id", invite.id);

  return NextResponse.json({ status: "declined" });
}
