// POST /api/members/invite
//
// Single invite flow — S2.2.
// Looks up user by email. If found, creates an active membership.
// If not found, sends a Supabase auth invite email and returns { status: 'invite_sent' }.
// Membership is created when invitee signs up via the invite link (S2.7).
//
// Body: { clubSlug, email, batchId, planId, startDate }
// Returns:
//   { status: 'added', membershipId, userId }    — membership created
//   { status: 'invite_sent' }                    — email invite dispatched
//
// Error codes:
//   400 — missing / invalid fields
//   401 — not authenticated
//   403 — caller is not staff of this club
//   404 — club not found
//   409 — already a member of this club
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";
import { MembershipStatus } from "@zenzo/database/enums";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Body = {
  clubSlug?: string;
  email?: string;
  batchId?: string;
  planId?: string;
  startDate?: string;
};

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

  // ── 2. Parse + validate body ────────────────────────────────────────────────
  const body = (await request.json()) as Body;
  const clubSlug  = body.clubSlug?.trim() ?? "";
  const email     = body.email?.trim().toLowerCase() ?? "";
  const batchId   = body.batchId?.trim() ?? "";
  const planId    = body.planId?.trim() ?? "";
  const startDate = body.startDate ?? new Date().toISOString().slice(0, 10);

  if (!clubSlug || !email || !batchId || !planId) {
    return NextResponse.json(
      { error: "clubSlug, email, batchId, and planId are required" },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  // ── 3. Resolve club + verify caller is staff ────────────────────────────────
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const { data: staffRow, error: staffError } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (staffError || !staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 4. Look up the invitee by email ─────────────────────────────────────────
  const admin = createSupabaseAdminClient();

  const { data: invitee } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  // ── 5a. Not on Zenzo — send email invite ─────────────────────────────────────
  if (!invitee) {
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/auth/callback`,
    });
    return NextResponse.json({ status: "invite_sent" });
  }

  // ── 5b. Check not already a member ──────────────────────────────────────────
  const { data: existing } = await admin
    .from("club_memberships")
    .select("id, status")
    .eq("club_id", club.id)
    .eq("user_id", invitee.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "already_a_member", status: existing.status },
      { status: 409 }
    );
  }

  // ── 6. Create membership ─────────────────────────────────────────────────────
  const { data: membership, error: membershipError } = await admin
    .from("club_memberships")
    .insert({
      club_id:       club.id,
      user_id:       invitee.id,
      plan_id:       planId,
      status:        MembershipStatus.Active,
      joined_at:     startDate,
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

  // ── 7. Assign batch ──────────────────────────────────────────────────────────
  const { error: batchError } = await admin
    .from("member_batches")
    .insert({
      membership_id: membership.id,
      batch_id:      batchId,
    });

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  return NextResponse.json({
    status:       "added",
    membershipId: membership.id,
    userId:       invitee.id,
  });
}
