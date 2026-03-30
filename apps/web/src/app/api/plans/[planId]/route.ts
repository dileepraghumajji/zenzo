// PUT /api/plans/[planId]
// DELETE /api/plans/[planId]
//
// Updates or deletes a fee plan.
//
// PUT Body: { clubSlug, name, amount_paise, billing_cycle }
// Returns: { success: true }
//
// DELETE Body: { clubSlug }
// Returns: { success: true }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BillingCycle } from "@zenzo/database/enums";

type PutBody = {
  clubSlug?:      string;
  name?:          string;
  amount_paise?:  number;
  billing_cycle?: BillingCycle;
};

type DeleteBody = {
  clubSlug?: string;
};

const VALID_CYCLES = new Set<string>(Object.values(BillingCycle));

export async function PUT(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as PutBody;
  const clubSlug     = body.clubSlug?.trim();
  const name         = body.name?.trim();
  const amount_paise = body.amount_paise;
  const billing_cycle = body.billing_cycle;

  if (!clubSlug || !name || amount_paise === undefined || amount_paise === null || !billing_cycle) {
    return NextResponse.json(
      { error: "Missing required fields" },
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

  // Resolve club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Ensure caller is staff
  const { data: staffRow } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("fee_plans")
    .update({
      name,
      amount_paise,
      billing_cycle,
      updated_at: new Date().toISOString()
    })
    .eq("id", params.planId)
    .eq("club_id", club.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as DeleteBody;
  const clubSlug = body.clubSlug?.trim();

  if (!clubSlug) {
    return NextResponse.json({ error: "clubSlug is required" }, { status: 400 });
  }

  // Resolve club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Ensure caller is staff
  const { data: staffRow } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("fee_plans")
    .delete()
    .eq("id", params.planId)
    .eq("club_id", club.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
