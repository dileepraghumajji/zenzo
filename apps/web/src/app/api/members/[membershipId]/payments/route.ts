import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { BillingCycle, MembershipStatus } from "@zenzo/database/enums";

export async function POST(
  request: NextRequest,
  { params }: { params: { membershipId: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clubSlug, amount_paise, method, payment_date, note } = body;

  if (!clubSlug || !amount_paise || !method || !payment_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Resolve club + verify staff
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", club.id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Fetch membership + plan to calculate next_due_date
  const { data: membership, error: memError } = await supabase
    .from("club_memberships")
    .select("next_due_date, plan_id, fee_plans(billing_cycle)")
    .eq("id", params.membershipId)
    .single();

  if (memError || !membership) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }

  // 3. Calculate next due date
  let nextDueDate = membership.next_due_date || payment_date;
  const cycle = membership.fee_plans?.billing_cycle as BillingCycle;

  if (cycle) {
    const d = new Date(nextDueDate);
    if (cycle === BillingCycle.Monthly)    d.setMonth(d.getMonth() + 1);
    else if (cycle === BillingCycle.Quarterly)  d.setMonth(d.getMonth() + 3);
    else if (cycle === BillingCycle.HalfYearly) d.setMonth(d.getMonth() + 6);
    else if (cycle === BillingCycle.Annual)     d.setFullYear(d.getFullYear() + 1);
    // per_session doesn't advance by date in a simple way, maybe just set to null or same?
    // For now, we'll only advance for period-based cycles.
    
    if (cycle !== BillingCycle.PerSession) {
      nextDueDate = d.toISOString().slice(0, 10);
    }
  }

  // 4. Insert payment
  const { data: payment, error: pError } = await supabase
    .from("payments")
    .insert({
      membership_id: params.membershipId,
      amount_paise,
      method,
      payment_date,
      note,
      reference:   null,
      recorded_by: user.id,
    })
    .select()
    .single();

  if (pError) {
    return NextResponse.json({ error: pError.message }, { status: 500 });
  }

  // 5. Update membership (next_due_date + status)
  const { error: uError } = await supabase
    .from("club_memberships")
    .update({ 
      next_due_date: nextDueDate,
      status: MembershipStatus.Active // Reactivate if was overdue/expired
    })
    .eq("id", params.membershipId);

  if (uError) {
    return NextResponse.json({ error: uError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, payment });
}
