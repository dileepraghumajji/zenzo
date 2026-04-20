import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { BillingCycle, MembershipStatus } from "@zenzo/database/enums";
import { sendEmail, isNotifEnabled } from "@/lib/email";
import { receiptEmailHtml } from "@/lib/email-templates/receipt";
import { calculateNextDueDate } from "@zenzo/utils";
import { APP_URL } from "@/lib/constants";

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
  const fromDate = membership.next_due_date || payment_date;
  const cycle = membership.fee_plans?.billing_cycle as BillingCycle | undefined;
  const nextDueDate = cycle ? (calculateNextDueDate(fromDate, cycle) ?? fromDate) : fromDate;

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
    .select("id, membership_id, amount_paise, method, payment_date, reference, note, recorded_by, created_at")
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

  // Send receipt email — fire-and-forget
  void sendReceiptEmail({
    supabase,
    membershipId: params.membershipId,
    clubId: club.id,
    paymentId: payment.id,
    amountPaise: amount_paise as number,
    paymentDate: payment_date as string,
    method: method as string,
    note: (note as string | null) ?? null,
  });

  return NextResponse.json({ success: true, payment });
}

async function sendReceiptEmail({
  supabase,
  membershipId,
  clubId,
  paymentId,
  amountPaise,
  paymentDate,
  method,
  note,
}: {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  membershipId: string;
  clubId: string;
  paymentId: string;
  amountPaise: number;
  paymentDate: string;
  method: string;
  note: string | null;
}): Promise<void> {
  const [membershipResult, clubResult] = await Promise.all([
    supabase
      .from("club_memberships")
      .select("user_id, plan_id, fee_plans(name), users(email, full_name)")
      .eq("id", membershipId)
      .single(),
    supabase
      .from("clubs")
      .select("name, slug, terminology")
      .eq("id", clubId)
      .single(),
  ]);

  const mem  = membershipResult.data;
  const club = clubResult.data;
  if (!mem || !club) return;

  const userRow = mem.users as { email: string; full_name: string } | null;
  const planRow = mem.fee_plans as { name: string } | null;
  if (!userRow) return;

  if (!isNotifEnabled(club.terminology as Record<string, unknown> | null, "notif_payment_receipt")) return;

  const receiptUrl = club.slug
    ? `${APP_URL}/portal/${club.slug}/payments/${paymentId}`
    : `${APP_URL}/portal`;

  await sendEmail({
    to: userRow.email,
    subject: `Payment receipt — ${club.name}`,
    html: receiptEmailHtml({
      memberName:  userRow.full_name,
      clubName:    club.name,
      amountPaise,
      paymentDate,
      method,
      planName:    planRow?.name ?? null,
      reference:   null,
      note,
      receiptUrl,
    }),
  });
}
