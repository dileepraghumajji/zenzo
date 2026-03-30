// DELETE /api/batches/[batchId]/members/[memberBatchId]
//
// Removes a member from a batch (deletes the member_batches row).
//
// Returns: { success: true }
//
// Error codes:
//   401 — not authenticated
//   403 — caller is not staff of the batch's club
//   404 — batch or member_batches row not found
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { batchId: string; memberBatchId: string } }
) {
  const { batchId, memberBatchId } = params;

  // ── 1. Auth ─────────────────────────────────────────────────────────────
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── 2. Verify batch exists and caller is staff ────────────────────────────
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

  // ── 3. Delete the member_batches row ─────────────────────────────────────
  const { error: deleteError } = await supabase
    .from("member_batches")
    .delete()
    .eq("id", memberBatchId)
    .eq("batch_id", batchId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
