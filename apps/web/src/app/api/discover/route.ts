// GET /api/discover
//
// Personalized club feed for authenticated users.
// Reads user's interest slugs + city, maps to ClubCategory values,
// returns verified+listed clubs filtered by category and city.
// Also counts pending invites to surface the invite banner.
//
// Response: { inviteCount, userCity, clubs[], hasMore, nextCursor }
// Cache-Control: private, max-age=300 (personalized — no CDN)

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ClubCategory, InterestSlug, VerificationStatus } from "@zenzo/database";

const PAGE_SIZE = 20;

// Maps interest slugs to matching ClubCategory business_type values.
// Swimming has no matching category yet — intentionally omitted.
const INTEREST_TO_CATEGORIES: Partial<Record<InterestSlug, ClubCategory[]>> = {
  [InterestSlug.MartialArts]: [ClubCategory.MartialArts],
  [InterestSlug.Boxing]:      [ClubCategory.MartialArts],
  [InterestSlug.Fitness]:     [ClubCategory.Gym],
  [InterestSlug.Crossfit]:    [ClubCategory.Gym],
  [InterestSlug.Dance]:       [ClubCategory.Dance],
  [InterestSlug.Yoga]:        [ClubCategory.Yoga],
  [InterestSlug.Other]:       [ClubCategory.Other],
};

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = parseInt(searchParams.get("cursor") ?? "0", 10);

  // Load user interests + profile in parallel
  const [interestsRes, profileRes] = await Promise.all([
    supabase.from("user_interests").select("slug").eq("user_id", user.id),
    supabase.from("users").select("city, email, phone").eq("id", user.id).single(),
  ]);

  const userSlugs = (interestsRes.data ?? []).map((i) => i.slug as InterestSlug);
  const userCity = profileRes.data?.city ?? null;
  const userEmail = profileRes.data?.email ?? user.email ?? null;
  const userPhone = profileRes.data?.phone ?? null;

  // Deduplicate categories (e.g. martial_arts + boxing both map to martial_arts)
  const matchedCategories = [
    ...new Set(userSlugs.flatMap((slug) => INTEREST_TO_CATEGORIES[slug] ?? [])),
  ] as ClubCategory[];

  // Build query: verified + listed clubs, filtered by interests and city
  let clubsQuery = supabase
    .from("clubs")
    .select("id, slug, name, business_type, city, logo_url, description")
    .eq("listed", true)
    .eq("verification_status", VerificationStatus.Verified);

  if (matchedCategories.length > 0) {
    clubsQuery = clubsQuery.in("business_type", matchedCategories);
  }

  if (userCity) {
    clubsQuery = clubsQuery.ilike("city", userCity);
  }

  const { data: clubs } = await clubsQuery
    .order("created_at", { ascending: false })
    .range(cursor, cursor + PAGE_SIZE - 1);

  // Count pending invites via admin client (club_invites RLS is keyed on
  // email/phone, not user_id — admin bypasses the restriction safely)
  let inviteCount = 0;
  const admin = createSupabaseAdminClient();
  const inviteConditions: string[] = [];
  if (userEmail) inviteConditions.push(`email.eq.${userEmail}`);
  if (userPhone) inviteConditions.push(`phone.eq.${userPhone}`);

  if (inviteConditions.length > 0) {
    const now = new Date().toISOString();
    const { count } = await admin
      .from("club_invites")
      .select("id", { count: "exact", head: true })
      .or(inviteConditions.join(","))
      .eq("status", "pending")
      .gt("expires_at", now);
    inviteCount = count ?? 0;
  }

  const result = clubs ?? [];

  return NextResponse.json(
    {
      inviteCount,
      userCity,
      clubs: result,
      hasMore: result.length === PAGE_SIZE,
      nextCursor: result.length === PAGE_SIZE ? cursor + PAGE_SIZE : null,
    },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
