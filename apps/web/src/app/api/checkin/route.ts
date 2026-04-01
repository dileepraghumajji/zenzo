// POST /api/checkin
//
// Public endpoint — no session required.
// Member scans QR code → enters phone → this route marks them present.
//
// Body: { token: string, phone: string }
//
// Security:
//   - Token is HMAC-signed and date-scoped (verifyQRToken)
//   - batchId is extracted from the verified token (never trusted from client)
//   - Admin client used because there is no user session
//   - Unique constraint on (membership_id, batch_id, date) prevents duplicate check-ins

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyQRToken } from "@/lib/qr-token";
import { AttendanceStatus } from "@zenzo/database/enums";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json() as { token?: string; phone?: string };
  const { token, phone } = body;

  if (!token || !phone) {
    return NextResponse.json({ error: "Missing token or phone" }, { status: 400 });
  }

  // ── Validate phone ───────────────────────────────────────────────────────
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit mobile number" },
      { status: 400 }
    );
  }

  // ── Verify token ─────────────────────────────────────────────────────────
  const payload = verifyQRToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "This QR code has expired. Ask your coach to refresh it." },
      { status: 400 }
    );
  }

  const { batchId, date } = payload;

  // admin: RLS bypassed because this is a public endpoint with token-based auth
  const supabase = createSupabaseAdminClient();

  // ── Look up batch + club ──────────────────────────────────────────────────
  const { data: batch } = await supabase
    .from("batches")
    .select("id, club_id, name")
    .eq("id", batchId)
    .single();

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // ── Look up user by phone ─────────────────────────────────────────────────
  const { data: memberUser } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("phone", cleanPhone)
    .single();

  if (!memberUser) {
    return NextResponse.json(
      { error: "No Zenzo account found for this number. Ask your coach to invite you." },
      { status: 404 }
    );
  }

  // ── Look up active membership for this club ───────────────────────────────
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("id, status")
    .eq("user_id", memberUser.id)
    .eq("club_id", batch.club_id)
    .in("status", ["active", "overdue"])
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "You don't have an active membership at this club." },
      { status: 403 }
    );
  }

  // ── Check if already present ──────────────────────────────────────────────
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("membership_id", membership.id)
    .eq("batch_id", batchId)
    .eq("date", date)
    .single();

  if (existing?.status === AttendanceStatus.Present) {
    return NextResponse.json({
      success: true,
      alreadyMarked: true,
      name: memberUser.full_name,
    });
  }

  // ── Check if in batch (to determine drop-in) ──────────────────────────────
  const { data: memberBatch } = await supabase
    .from("member_batches")
    .select("id")
    .eq("membership_id", membership.id)
    .eq("batch_id", batchId)
    .single();

  const isDropIn = !memberBatch;

  // ── Upsert attendance record ──────────────────────────────────────────────
  const { error: upsertError } = await supabase
    .from("attendance_records")
    .upsert(
      {
        membership_id: membership.id,
        batch_id:      batchId,
        date,
        status:        AttendanceStatus.Present,
        marked_by:     null,
        is_drop_in:    isDropIn,
      },
      { onConflict: "membership_id,batch_id,date" }
    );

  if (upsertError) {
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    alreadyMarked: false,
    name: memberUser.full_name,
    isDropIn,
  });
}

// GET /api/checkin/count — live present count for a batch+date (used by QR modal polling)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const batchId = searchParams.get("batchId");
  const date    = searchParams.get("date");
  const token   = searchParams.get("token");

  if (!batchId || !date || !token) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Verify token to ensure the request is authorized
  const payload = verifyQRToken(token);
  if (!payload || payload.batchId !== batchId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // admin: RLS bypassed because this is token-gated, used for live QR display
  const supabase = createSupabaseAdminClient();

  const { count } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .eq("date", date)
    .eq("status", AttendanceStatus.Present);

  return NextResponse.json({ present: count ?? 0 });
}
