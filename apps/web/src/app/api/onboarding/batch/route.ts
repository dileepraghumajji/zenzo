// POST /api/onboarding/batch
//
// Step 3 of the onboarding wizard (optional).
// Creates the first batch for the new club.
//
// Uses the admin client for DB writes (same pattern as studio route).
//
// Body: { club_id, name, start_time, end_time, days }
// Returns: { id }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

type Body = {
  club_id?: string;
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
  const { club_id, name, start_time, end_time, days } = body;

  if (!club_id || !name || !start_time || !end_time || !days?.length) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Verify the caller is staff of this club
  const { data: staff } = await admin
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", club_id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: batch, error: batchError } = await admin
    .from("batches")
    .insert({
      club_id,
      name: name.trim(),
      start_time,
      end_time,
      days: days as any[],
      coach_id: user.id,
      max_capacity: null,
      description: null,
      deleted_at: null,
    })
    .select("id")
    .single();

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  return NextResponse.json({ id: batch.id });
}

