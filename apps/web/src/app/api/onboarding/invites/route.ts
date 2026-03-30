// POST /api/onboarding/invites
//
// Step 4 (optional) of the onboarding wizard.
// Accepts a list of phone numbers to invite as members.
//
// Phase 1 (Sprint 1): validates input and acknowledges the queue.
// WhatsApp dispatch via Interakt is wired up in Sprint 7.
// Membership rows are created when invitees sign up via invite link (Sprint 2 — S2.2, S2.7).
//
// Body: { club_id, invitees: [{ phone: string, name?: string }] }
// Returns: { queued: number }
//
// Error codes:
//   400 — missing club_id
//   401 — not authenticated
//   403 — caller is not staff of this club

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

type Invitee = { phone: string; name?: string };

type Body = {
  club_id?: string;
  invitees?: Invitee[];
};

function normalizePhone(v: string): string {
  const n = v.replace(/[\s-]/g, "");
  if (n.startsWith("+91")) return n.slice(3);
  if (n.startsWith("91") && n.length === 12) return n.slice(2);
  return n;
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const { club_id, invitees } = body;

  if (!club_id) {
    return NextResponse.json({ error: "club_id is required" }, { status: 400 });
  }

  // No invitees submitted — nothing to do
  if (!invitees || invitees.length === 0) {
    return NextResponse.json({ queued: 0 });
  }

  const admin = createSupabaseAdminClient();

  // Verify caller is staff of this club
  const { data: staff } = await admin
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", club_id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Filter to valid 10-digit Indian numbers only
  const valid = invitees
    .map((inv) => ({ ...inv, phone: normalizePhone(inv.phone) }))
    .filter((inv) => /^\d{10}$/.test(inv.phone));

  // Sprint 1: invites are acknowledged but not yet dispatched.
  // WhatsApp sending + membership creation happen in Sprint 7 + Sprint 2.
  return NextResponse.json({ queued: valid.length });
}
