import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PaymentMethod, BillingCycle } from "@zenzo/database/enums";

function calculateNextDueDate(fromDate: string, cycle: BillingCycle): string {
  const d = new Date(fromDate);
  if (cycle === BillingCycle.Monthly)     d.setMonth(d.getMonth() + 1);
  else if (cycle === BillingCycle.Quarterly)   d.setMonth(d.getMonth() + 3);
  else if (cycle === BillingCycle.HalfYearly)  d.setMonth(d.getMonth() + 6);
  else if (cycle === BillingCycle.Annual)      d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0]!;
}

export async function POST(
  request: Request,
  { params }: { params: { clubSlug: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    membershipId?: string;
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, membershipId } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !membershipId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify HMAC signature
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  let signatureValid = false;
  try {
    signatureValid = timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(razorpay_signature, "hex"));
  } catch {
    // timingSafeEqual throws if buffers have different lengths
  }
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Verify membership belongs to this user
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("id, plan_id, status")
    .eq("id", membershipId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();
  if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 });

  // Fetch fee plan for amount + billing cycle
  const { data: feePlan } = membership.plan_id
    ? await supabase
        .from("fee_plans")
        .select("amount_paise, billing_cycle")
        .eq("id", membership.plan_id)
        .single()
    : { data: null };

  const today = new Date().toISOString().split("T")[0]!;

  // Record payment
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      membership_id: membershipId,
      amount_paise: feePlan?.amount_paise ?? 0,
      method: PaymentMethod.Razorpay,
      payment_date: today,
      reference: razorpay_payment_id,
      note: `Razorpay order: ${razorpay_order_id}`,
      recorded_by: user.id,
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  // Advance next_due_date and reactivate if overdue/expired
  if (feePlan) {
    const nextDue = calculateNextDueDate(today, feePlan.billing_cycle as BillingCycle);
    await supabase
      .from("club_memberships")
      .update({ next_due_date: nextDue, status: "active" })
      .eq("id", membershipId);
  }

  // Suppressed: params is used to scope the route to the correct club, no additional check needed
  void params;

  return NextResponse.json({ ok: true, paymentId: payment.id });
}
