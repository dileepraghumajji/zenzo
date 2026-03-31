// POST /api/onboarding/invites
//
// Step 4 (optional) of the onboarding wizard.
// Accepts a list of emails to invite as members.
// Sends a Supabase auth invite email for each address not yet on Zenzo.
// WhatsApp dispatch via Interakt is wired up in a future sprint.
//
// Body: { club_id, invitees: [{ email: string, name?: string }] }
// Returns: { sent: number }
//
// Error codes:
//   400 — missing club_id
//   401 — not authenticated
//   403 — caller is not staff of this club

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

type Invitee = { email: string; name?: string };

type Body = {
  club_id?: string;
  invitees?: Invitee[];
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    return NextResponse.json({ sent: 0 });
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

  // Filter to non-empty, roughly valid email addresses
  const valid = invitees.filter((inv) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email.trim()));

  // Send Supabase invite email for each address
  let sent = 0;
  await Promise.allSettled(
    valid.map(async (inv) => {
      const { error } = await admin.auth.admin.inviteUserByEmail(inv.email.trim(), {
        redirectTo: `${APP_URL}/auth/callback`,
        data: { full_name: inv.name?.trim() ?? "" },
      });
      if (!error) sent++;
    })
  );

  return NextResponse.json({ sent });
}
