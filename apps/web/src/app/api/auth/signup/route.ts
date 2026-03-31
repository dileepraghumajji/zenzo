// POST /api/auth/signup
//
// Called by the signup page AFTER supabase.auth.signUp() succeeds and a
// session is established (i.e. email confirmation is disabled in Supabase).
//
// The handle_new_user() trigger on auth.users already creates the `users`
// row automatically, so this route now just ensures the row exists and
// returns success.
//
// Body: { full_name: string; phone: string }
// Returns: { ok: true }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  // The handle_new_user() trigger creates the users row on signup.
  // This upsert ensures data is up-to-date if the trigger already ran.
  const { error: upsertError } = await supabase.from("users").upsert(
    {
      id: user.id,
      full_name,
      phone,
      email: user.email ?? "",
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
