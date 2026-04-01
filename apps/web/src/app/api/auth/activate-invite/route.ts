// POST /api/auth/activate-invite
//
// Sprint T: Activates a pending club invite for the currently authenticated user.
//
// Two call sites:
//   1. Signup page — user arrives via /signup?token=xxx and calls this after account creation.
//   2. /portal/invites — user clicks [Accept] on a pending invite.
//
// Query param: ?token=xxx   (required when accepting via link)
// Body (optional): { token }  (alternative to query param)
//
// Logic:
//   a. Validate token: must be 'pending' and not expired.
//   b. Create club_membership (active) + member_batches row (if batch_id set).
//   c. Mark club_invites.status = 'accepted'.
//
// Also called without a token on signup to sweep any invites matching the user's email.
//
// Returns: { status: 'activated', membershipId }
//
// Error codes:
//   400 — missing token (when no email sweep needed)
//   401 — not authenticated
//   404 — invite not found or already used
//   409 — already a member of this club
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { MembershipStatus } from "@zenzo/database/enums";

export async function POST(request: NextRequest) {
  // ── 1. Auth ─────────────────────────────────────────────────────────────────
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // ── 2. Resolve token ─────────────────────────────────────────────────────────
  const url = new URL(request.url);
  let token = url.searchParams.get("token");

  if (!token) {
    // Try to read from request body (optional)
    try {
      const body = (await request.json()) as { token?: string };
      token = body.token ?? null;
    } catch {
      // no body — that's fine, we'll fall through to the email sweep
    }
  }

  // ── 3a. Token-based activation ───────────────────────────────────────────────
  if (token) {
    const now = new Date().toISOString();

    const { data: invite, error: inviteError } = await admin
      .from("club_invites")
      .select("id, club_id, plan_id, batch_id, status, expires_at, email")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invite already used or expired" }, { status: 404 });
    }

    if (invite.expires_at < now) {
      // Mark as expired
      await admin
        .from("club_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);
      return NextResponse.json({ error: "Invite has expired" }, { status: 404 });
    }

    return activateInvite({ admin, invite, userId: user.id });
  }

  // ── 3b. Email sweep — activate all pending invites for this user's email ─────
  const { data: userRow } = await admin
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!userRow) {
    return NextResponse.json({ status: "no_invites" });
  }

  const now = new Date().toISOString();

  const { data: invites } = await admin
    .from("club_invites")
    .select("id, club_id, plan_id, batch_id, status, expires_at, email")
    .eq("email", userRow.email)
    .eq("status", "pending")
    .gt("expires_at", now);

  if (!invites || invites.length === 0) {
    return NextResponse.json({ status: "no_invites" });
  }

  // Activate all matching invites
  const results = await Promise.allSettled(
    invites.map((invite) => activateInvite({ admin, invite, userId: user.id }))
  );

  const activated = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ status: "swept", activated });
}

// ─── Shared activation logic ──────────────────────────────────────────────────

type InviteRow = {
  id: string;
  club_id: string;
  plan_id: string | null;
  batch_id: string | null;
  status: string;
  expires_at: string;
  email: string | null;
};

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

async function activateInvite({
  admin,
  invite,
  userId,
}: {
  admin: AdminClient;
  invite: InviteRow;
  userId: string;
}): Promise<NextResponse> {
  // Check not already a member
  const { data: existing } = await admin
    .from("club_memberships")
    .select("id")
    .eq("club_id", invite.club_id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    // Mark invite accepted anyway (user is already a member)
    await admin
      .from("club_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);
    return NextResponse.json(
      { error: "already_a_member", membershipId: existing.id },
      { status: 409 }
    );
  }

  // Create membership
  const today = new Date().toISOString().slice(0, 10);
  const { data: membership, error: membershipError } = await admin
    .from("club_memberships")
    .insert({
      club_id:       invite.club_id,
      user_id:       userId,
      plan_id:       invite.plan_id,
      status:        MembershipStatus.Active,
      joined_at:     today,
      next_due_date: null,
      deleted_at:    null,
    })
    .select("id")
    .single();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: membershipError?.message ?? "Failed to create membership" },
      { status: 500 }
    );
  }

  // Assign batch if specified
  if (invite.batch_id) {
    await admin
      .from("member_batches")
      .insert({ membership_id: membership.id, batch_id: invite.batch_id });
  }

  // Mark invite as accepted
  await admin
    .from("club_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  return NextResponse.json({ status: "activated", membershipId: membership.id });
}
