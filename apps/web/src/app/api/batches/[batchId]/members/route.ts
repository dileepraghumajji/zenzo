// POST /api/batches/[batchId]/members
//
// Assigns an existing active club member (by membershipId) to a batch.
//
// Body: { membershipId }
// Returns: { memberBatchId }
//
// Error codes:
//   400 — missing fields
//   401 — not authenticated
//   403 — caller is not staff of the batch's club
//   404 — batch not found
//   409 — member already in this batch
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  membershipId?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const { batchId } = params;

  // ── 1. Auth ─────────────────────────────────────────────────────────────
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────
  const body = (await request.json()) as Body;
  const membershipId = body.membershipId?.trim() ?? "";

  if (!membershipId) {
    return NextResponse.json({ error: "membershipId is required" }, { status: 400 });
  }

  // ── 3. Verify batch exists and caller is staff of its club ───────────────
  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("id, club_id")
    .eq("id", batchId)
    .is("deleted_at", null)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const { data: staffRow, error: staffError } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", batch.club_id)
    .eq("user_id", user.id)
    .single();

  if (staffError || !staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 4. Verify membership belongs to this club ────────────────────────────
  const { data: membership, error: membershipError } = await supabase
    .from("club_memberships")
    .select("id")
    .eq("id", membershipId)
    .eq("club_id", batch.club_id)
    .is("deleted_at", null)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "Membership not found in this club" },
      { status: 400 }
    );
  }

  // ── 5. Check not already in this batch ───────────────────────────────────
  const { data: existing } = await supabase
    .from("member_batches")
    .select("id")
    .eq("batch_id", batchId)
    .eq("membership_id", membershipId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Member is already in this batch" },
      { status: 409 }
    );
  }

  // ── 6. Assign ─────────────────────────────────────────────────────────────
  const { data: memberBatch, error: insertError } = await supabase
    .from("member_batches")
    .insert({ batch_id: batchId, membership_id: membershipId })
    .select("id")
    .single();

  if (insertError || !memberBatch) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to add member to batch" },
      { status: 500 }
    );
  }

  return NextResponse.json({ memberBatchId: memberBatch.id });
}
