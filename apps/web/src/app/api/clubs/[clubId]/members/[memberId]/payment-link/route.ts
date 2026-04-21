import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createRazorpay } from "@/lib/razorpay";
import { StaffRole } from "@zenzo/database/enums";

export async function POST(
  _req: Request,
  { params }: { params: { clubId: string; memberId: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve clubId — accept UUID or slug
  const isUuid = /^[0-9a-f-]{36}$/.test(params.clubId);
  const { data: club } = isUuid
    ? await supabase.from("clubs").select("id, name").eq("id", params.clubId).single()
    : await supabase.from("clubs").select("id, name").eq("slug", params.clubId).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  // Caller must be owner or coach of this club
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();
  if (!staff || (staff.role !== StaffRole.Owner && staff.role !== StaffRole.Coach)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve membership — memberId is the membership UUID
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("id, plan_id, user_id")
    .eq("id", params.memberId)
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .single();
  if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 });

  if (!membership.plan_id) {
    return NextResponse.json({ error: "Member has no fee plan assigned" }, { status: 400 });
  }

  // Fetch fee plan
  const { data: feePlan } = await supabase
    .from("fee_plans")
    .select("id, name, amount_paise")
    .eq("id", membership.plan_id)
    .single();
  if (!feePlan) return NextResponse.json({ error: "Fee plan not found" }, { status: 404 });

  // Fetch member profile for prefill
  const { data: member } = await supabase
    .from("users")
    .select("full_name, phone, email")
    .eq("id", membership.user_id)
    .single();

  const razorpay = createRazorpay();

  // Create a Razorpay Payment Link
  const link = await razorpay.paymentLink.create({
    amount: feePlan.amount_paise,
    currency: "INR",
    description: `${feePlan.name} — ${club.name}`,
    customer: {
      name: member?.full_name ?? undefined,
      contact: member?.phone ? `+91${member.phone}` : undefined,
      email: member?.email ?? undefined,
    },
    notify: {
      sms: false,
      email: member?.email ? true : false,
    },
    reminder_enable: false,
    notes: {
      membership_id: membership.id,
      club_id: club.id,
      plan_id: feePlan.id,
    },
  });

  return NextResponse.json({
    url: link.short_url,
    amount: feePlan.amount_paise,
    planName: feePlan.name,
    memberName: member?.full_name ?? "Member",
    phone: member?.phone ?? null,
  });
}
