// GET /api/batches/:batchId/qr
//
// Generates a date-scoped HMAC-signed QR token for a batch.
// Requires coach or owner authentication.
//
// Returns: { checkInUrl, token, expiresAt }

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createQRToken } from "@/lib/qr-token";
import { NextRequest, NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const clubSlug = searchParams.get("clubSlug");

  if (!clubSlug) {
    return NextResponse.json({ error: "Missing clubSlug" }, { status: 400 });
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

  // ── Verify batch belongs to this club ────────────────────────────────────
  const { data: batch } = await supabase
    .from("batches")
    .select("id, name")
    .eq("id", params.batchId)
    .eq("club_id", club.id)
    .single();

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // ── Generate token ───────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const token = createQRToken(params.batchId, today);

  const checkInUrl = `${APP_URL}/checkin?b=${params.batchId}&t=${encodeURIComponent(token)}`;
  const expiresAt  = new Date(`${today}T23:59:59.999Z`).toISOString();

  return NextResponse.json({ checkInUrl, token, batchName: batch.name, expiresAt });
}
