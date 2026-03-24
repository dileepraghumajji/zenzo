// POST /api/auth/signup
//
// Called by the signup page AFTER supabase.auth.signUp() succeeds and a
// session is established (i.e. email confirmation is disabled in Supabase).
//
// Creates the `profiles` row for the new owner. tenant_id is intentionally
// null here — it gets set in Step 2 of the onboarding wizard when the
// business is created.
//
// Body: { full_name: string; phone: string }
// Returns: { ok: true }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserRole } from "@zenzo/database/enums";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { full_name?: string; phone?: string };
  const full_name = body.full_name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    role: UserRole.Owner,
    full_name,
    phone,
    email: user.email ?? null,
    // tenant_id: null — set during onboarding wizard Step 2
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
