// POST /api/onboarding/invites
//
// Step 4 (optional) of the onboarding wizard — Sprint T updated.
// Inserts club_invites rows and sends Supabase invite emails with token links.
// WhatsApp dispatch via Interakt is wired up in Sprint W.
//
// Body: { club_id, invitees: [{ email: string, name?: string }] }
// Returns: { sent: number }
//
// Error codes:
//   400 — missing club_id
//   401 — not authenticated
//   403 — caller is not staff of this club

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
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
  const valid = invitees.filter((inv) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email.trim())
  );

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Insert club_invites rows and send invite emails
  let sent = 0;
  await Promise.allSettled(
    valid.map(async (inv) => {
      const email = inv.email.trim().toLowerCase();
      const token = randomUUID();

      const { error: insertError } = await admin
        .from("club_invites")
        .insert({
          club_id,
          email,
          token,
          plan_id:    null,
          batch_id:   null,
          invited_by: user.id,
          status:     "pending",
          expires_at: expiresAt,
        });

      if (insertError) return;

      const { error: emailError } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${APP_URL}/signup?token=${token}`,
        data: { full_name: inv.name?.trim() ?? "" },
      });

      if (!emailError) sent++;
    })
  );

  return NextResponse.json({ sent });
}
