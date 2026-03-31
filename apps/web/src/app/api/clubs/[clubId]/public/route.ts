// GET /api/clubs/[clubId]/public — unauthenticated club detail endpoint
// [clubId] here is actually a slug (string). Only returns data if club is verified.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerificationStatus } from "@zenzo/database/enums";

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string } },
) {
  const supabase = createSupabaseServerClient();

  // Club — clubId param is a slug for public routes
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, city, phone, business_type, description, verification_status")
    .eq("slug", params.clubId)
    .single();

  if (!club || club.verification_status !== VerificationStatus.Verified) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fee plans
  const { data: plans } = await supabase
    .from("fee_plans")
    .select("id, name, amount_paise, billing_cycle")
    .eq("club_id", club.id)
    .order("amount_paise", { ascending: true });

  // Batches
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, start_time, end_time, days")
    .eq("club_id", club.id)
    .order("name", { ascending: true });

  // Staff (coaches + owner)
  const { data: staff } = await supabase
    .from("club_staff")
    .select("id, role, user_id")
    .eq("club_id", club.id);

  const staffUserIds = (staff ?? []).map((s) => s.user_id);
  let staffUsers: { id: string; full_name: string }[] = [];
  if (staffUserIds.length > 0) {
    const { data } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", staffUserIds);
    staffUsers = data ?? [];
  }

  const staffWithNames = (staff ?? []).map((s) => ({
    ...s,
    full_name: staffUsers.find((u) => u.id === s.user_id)?.full_name ?? "",
  }));

  return NextResponse.json({
    club: {
      id:            club.id,
      name:          club.name,
      slug:          club.slug,
      city:          club.city,
      phone:         club.phone,
      business_type: club.business_type,
      description:   club.description,
    },
    plans:   plans   ?? [],
    batches: batches ?? [],
    staff:   staffWithNames,
  });
}
