import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createRazorpay } from "@/lib/razorpay";

export async function POST(
  _req: Request,
  { params }: { params: { clubSlug: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", params.clubSlug)
    .single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("club_memberships")
    .select("id, plan_id, status")
    .eq("user_id", user.id)
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: false })
    .limit(1)
    .single();
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  if (!membership.plan_id) return NextResponse.json({ error: "No fee plan assigned" }, { status: 400 });

  const { data: feePlan } = await supabase
    .from("fee_plans")
    .select("id, name, amount_paise")
    .eq("id", membership.plan_id)
    .single();
  if (!feePlan) return NextResponse.json({ error: "Fee plan not found" }, { status: 404 });

  const razorpay = createRazorpay();
  const order = await razorpay.orders.create({
    amount: feePlan.amount_paise,
    currency: "INR",
    receipt: `mem_${membership.id.slice(0, 8)}`,
    notes: {
      membership_id: membership.id,
      club_id: club.id,
      plan_id: feePlan.id,
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    clubName: club.name,
    planName: feePlan.name,
    membershipId: membership.id,
  });
}
