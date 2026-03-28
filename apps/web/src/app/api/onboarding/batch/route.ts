// POST /api/onboarding/batch
//
// Step 3 of the onboarding wizard (optional).
// Creates the first session (batch) for the new tenant.
//
// Body: { tenant_id, name, start_time, end_time, days }
// Returns: { id }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SessionType } from "@zenzo/database/enums";

type Body = {
  tenant_id?: string;
  name?: string;
  start_time?: string;
  end_time?: string;
  days?: string[];
};

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
  const { tenant_id, name, start_time, end_time, days } = body;

  if (!tenant_id || !name || !start_time || !end_time || !days?.length) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Verify the caller owns this tenant (prevents cross-tenant writes)
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profile?.tenant_id !== tenant_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      tenant_id,
      name: name.trim(),
      session_type: SessionType.Group,
      start_time,
      end_time,
      days,
      is_active: true,
    })
    .select("id")
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  return NextResponse.json({ id: session.id });
}
