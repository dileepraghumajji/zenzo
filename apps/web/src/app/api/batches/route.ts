// POST /api/batches
//
// Creates a new batch for a club.
//
// Body: { clubSlug, name, startTime, endTime, days, coachId?, maxCapacity?, description? }
// Returns:
//   { batchId }    — batch created
//
// Error codes:
//   400 — missing / invalid fields
//   401 — not authenticated
//   403 — caller is not staff of this club
//   404 — club not found
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DayOfWeek } from "@zenzo/database/enums";

type Body = {
  clubSlug?:    string;
  name?:        string;
  startTime?:   string;
  endTime?:     string;
  days?:        string[];
  coachId?:     string | null;
  maxCapacity?: number | null;
  description?: string | null;
};

const VALID_DAYS = new Set<string>(Object.values(DayOfWeek));

export async function POST(request: NextRequest) {
  // ── 1. Auth ─────────────────────────────────────────────────────────────
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── 2. Parse + validate body ─────────────────────────────────────────────
  const body = (await request.json()) as Body;

  const clubSlug    = body.clubSlug?.trim() ?? "";
  const name        = body.name?.trim() ?? "";
  const startTime   = body.startTime?.trim() ?? "";
  const endTime     = body.endTime?.trim() ?? "";
  const days        = body.days ?? [];
  const coachId     = body.coachId ?? null;
  const maxCapacity = body.maxCapacity ?? null;
  const description = body.description ?? null;

  if (!clubSlug || !name || !startTime || !endTime) {
    return NextResponse.json(
      { error: "clubSlug, name, startTime, and endTime are required" },
      { status: 400 }
    );
  }

  if (days.length === 0) {
    return NextResponse.json(
      { error: "At least one day is required" },
      { status: 400 }
    );
  }

  const invalidDay = days.find((d) => !VALID_DAYS.has(d));
  if (invalidDay) {
    return NextResponse.json(
      { error: `Invalid day value: ${invalidDay}` },
      { status: 400 }
    );
  }

  if (startTime >= endTime) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    );
  }

  // ── 3. Resolve club + verify caller is staff ──────────────────────────────
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const { data: staffRow, error: staffError } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (staffError || !staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 4. Create batch ───────────────────────────────────────────────────────
  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .insert({
      club_id:      club.id,
      name,
      start_time:   startTime,
      end_time:     endTime,
      days:         days as DayOfWeek[],
      coach_id:     coachId,
      max_capacity: maxCapacity,
      description,
      deleted_at:   null,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return NextResponse.json(
      { error: batchError?.message ?? "Failed to create batch" },
      { status: 500 }
    );
  }

  return NextResponse.json({ batchId: batch.id });
}
