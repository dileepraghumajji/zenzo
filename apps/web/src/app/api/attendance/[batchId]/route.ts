// POST /api/attendance/:batchId
//
// Bulk upsert attendance records for a batch on a given date.
// Body: { clubSlug, date, records: [{ membership_id, status }] }

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { AttendanceStatus } from "@zenzo/database/enums";

const VALID_STATUSES = Object.values(AttendanceStatus) as string[];

export async function POST(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clubSlug, date, records, skipExisting } = body;
  // skipExisting: true is sent by the offline sync-on-reconnect loop so that
  // records already confirmed on the server are not overwritten by stale local data.

  if (!clubSlug || !date || !Array.isArray(records)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Validate statuses
  for (const r of records) {
    if (!VALID_STATUSES.includes(r.status)) {
      return NextResponse.json(
        { error: `Invalid status: ${r.status}` },
        { status: 400 }
      );
    }
  }

  // ── Resolve club + verify staff ──────────────────────────────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", club.id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Verify batch belongs to this club ───────────────────────────────────
  const { data: batch } = await supabase
    .from("batches")
    .select("id")
    .eq("id", params.batchId)
    .eq("club_id", club.id)
    .single();

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  if (records.length === 0) {
    return NextResponse.json({ success: true, count: 0 });
  }

  // ── Upsert records ───────────────────────────────────────────────────────
  const rows = records.map((r: { membership_id: string; status: AttendanceStatus }) => ({
    membership_id: r.membership_id,
    batch_id: params.batchId,
    date,
    status: r.status,
    marked_by: user.id,
    is_drop_in: false,
  }));

  const { error } = await supabase
    .from("attendance_records")
    .upsert(rows, {
      onConflict: "membership_id,batch_id,date",
      ignoreDuplicates: skipExisting === true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: rows.length });
}
