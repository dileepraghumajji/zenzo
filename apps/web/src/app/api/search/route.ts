// GET /api/search?q=&type=clubs|coaches|members
//
// Clubs + coaches are public (no auth required).
// Members search requires authentication.
// Limit: 20 results per type.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffRole, VerificationStatus } from "@zenzo/database";

const MAX_RESULTS = 20;

type SearchType = "clubs" | "coaches" | "members";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") ?? "";
  const type = (searchParams.get("type") ?? "clubs") as SearchType;

  if (!["clubs", "coaches", "members"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Strip characters that break PostgREST filter string syntax
  const q = raw.trim().replace(/[,*]/g, "");

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createSupabaseServerClient();

  // Members search: auth required
  if (type === "members") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: users } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(MAX_RESULTS);

    const userIds = (users ?? []).map((u) => u.id);

    // Fetch interests for matched users
    let interestsMap: Record<string, string[]> = {};
    if (userIds.length > 0) {
      const { data: interests } = await supabase
        .from("user_interests")
        .select("user_id, slug")
        .in("user_id", userIds);

      interestsMap = (interests ?? []).reduce<Record<string, string[]>>(
        (acc, row) => {
          acc[row.user_id] = [...(acc[row.user_id] ?? []), row.slug];
          return acc;
        },
        {}
      );
    }

    const results = (users ?? []).map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      interests: interestsMap[u.id] ?? [],
      achievement_count: 0,
    }));

    return NextResponse.json({ results });
  }

  // Clubs search: public
  if (type === "clubs") {
    const { data } = await supabase
      .from("clubs")
      .select("id, slug, name, business_type, city")
      .eq("listed", true)
      .eq("verification_status", VerificationStatus.Verified)
      .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
      .limit(MAX_RESULTS);

    return NextResponse.json({ results: data ?? [] });
  }

  // Coaches search: public — two-step (find matching users, then filter to coaches)
  const { data: matchingUsers } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, username")
    .ilike("full_name", `%${q}%`)
    .limit(MAX_RESULTS);

  const userIds = (matchingUsers ?? []).map((u) => u.id);

  if (userIds.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const { data: staffRows } = await supabase
    .from("club_staff")
    .select("user_id, clubs(name, slug)")
    .eq("role", StaffRole.Coach)
    .in("user_id", userIds);

  // Group clubs per coach user_id
  const coachClubsMap: Record<string, { name: string; slug: string }[]> = {};
  for (const row of staffRows ?? []) {
    if (!row.clubs) continue;
    const club = row.clubs as { name: string; slug: string };
    coachClubsMap[row.user_id] = [
      ...(coachClubsMap[row.user_id] ?? []),
      { name: club.name, slug: club.slug },
    ];
  }

  // Only return users who have at least one coach role
  const coachUserIds = new Set(Object.keys(coachClubsMap));
  const results = (matchingUsers ?? [])
    .filter((u) => coachUserIds.has(u.id))
    .map((u) => ({
      user_id: u.id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      username: u.username,
      clubs: coachClubsMap[u.id] ?? [],
      avg_rating: null,
    }));

  return NextResponse.json({ results });
}
