// POST /api/plans
//
// Creates a new fee plan for a club.
//
// Body: { clubSlug, name, amount_paise, billing_cycle }
// Returns:
//   { planId }    — plan created
//
// Error codes:
//   400 — missing / invalid fields
//   401 — not authenticated
//   403 — caller is not staff of this club
//   404 — club not found
//   500 — DB error

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BillingCycle } from "@zenzo/database/enums";

type Body = {
  clubSlug?:      string;
  name?:          string;
  amount_paise?:  number;
  billing_cycle?: BillingCycle;
};

const VALID_CYCLES = new Set<string>(Object.values(BillingCycle));

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

  const clubSlug     = body.clubSlug?.trim() ?? "";
  const name         = body.name?.trim() ?? "";
  const amount_paise = body.amount_paise ?? null;
  const billing_cycle = body.billing_cycle ?? null;

  if (!clubSlug || !name || amount_paise === null || !billing_cycle) {
    return NextResponse.json(
      { error: "clubSlug, name, amount_paise, and billing_cycle are required" },
      { status: 400 }
    );
  }

  if (amount_paise < 0) {
    return NextResponse.json(
      { error: "amount_paise cannot be negative" },
      { status: 400 }
    );
  }

  if (!VALID_CYCLES.has(billing_cycle)) {
    return NextResponse.json(
      { error: `Invalid billing_cycle value: ${billing_cycle}` },
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

  // ── 4. Create plan ────────────────────────────────────────────────────────
  const { data: plan, error: planError } = await supabase
    .from("fee_plans")
    .insert({
      club_id:       club.id,
      name,
      amount_paise,
      billing_cycle,
    })
    .select("id")
    .single();

  if (planError || !plan) {
    return NextResponse.json(
      { error: planError?.message ?? "Failed to create fee plan" },
      { status: 500 }
    );
  }

  return NextResponse.json({ planId: plan.id });
}
