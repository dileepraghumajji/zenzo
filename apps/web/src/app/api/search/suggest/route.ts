// GET /api/search/suggest?q=
// Public endpoint. No auth required.
// Returns up to 10 autocomplete suggestions: 5 clubs + 5 coaches.
// Used by the SearchBar dropdown while typing.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffRole, VerificationStatus } from "@zenzo/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawQ = searchParams.get("q") ?? "";
  const q = rawQ.trim().replace(/[,*'\\]/g, "");

  if (q.length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  const supabase = createSupabaseServerClient();

  const pattern = `${q}%`;

  const [{ data: clubs }, { data: coaches }] = await Promise.all([
    supabase
      .from("clubs")
      .select("name, slug, business_type")
      .ilike("name", pattern)
      .eq("verification_status", VerificationStatus.Verified)
      .eq("listed", true)
      .limit(5),

    supabase
      .from("users")
      .select("id, full_name, username, specializations")
      .ilike("full_name", pattern)
      .not("specializations", "is", null)
      .limit(10), // over-fetch; we'll filter to actual coaches below
  ]);

  // Verify coaches by checking club_staff role
  const coachCandidateIds = (coaches ?? []).map((u) => u.id);
  let coachSuggestions: { label: string; slug: string | null; type: "coach" }[] = [];

  if (coachCandidateIds.length > 0) {
    const { data: staffRows } = await supabase
      .from("club_staff")
      .select("user_id")
      .eq("role", StaffRole.Coach)
      .in("user_id", coachCandidateIds);

    const coachIds = new Set((staffRows ?? []).map((r) => r.user_id));

    coachSuggestions = (coaches ?? [])
      .filter((u) => coachIds.has(u.id))
      .slice(0, 5)
      .map((u) => ({ label: u.full_name, slug: u.username ?? null, type: "coach" as const }));
  }

  const clubSuggestions = (clubs ?? []).map((c) => ({
    label: c.name,
    slug: c.slug,
    type: "club" as const,
    business_type: c.business_type,
  }));

  return NextResponse.json({
    suggestions: [...clubSuggestions, ...coachSuggestions].slice(0, 10),
  });
}
