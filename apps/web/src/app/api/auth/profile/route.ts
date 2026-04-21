// POST /api/auth/profile
//
// Called by the login page AFTER Supabase signInWithPassword() succeeds.
// Returns the user's destination so the login page can redirect correctly.
//
// Routing logic (authoritative — matches sprints.md):
//   has club_staff rows?
//     1 club  → { destination: '/:clubSlug/dashboard', clubs }
//     2+ clubs → { destination: '/clubs', clubs }
//   no club_staff rows (member or new user)?
//     → { destination: '/portal' }

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Find all clubs this user is staff at (owner or coach).
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role, club_id")
    .eq("user_id", user.id);

  // No club_staff rows → consumer or brand-new user
  if (!staff || staff.length === 0) {
    // If they've completed interest onboarding and have no memberships, send to discover.
    // Otherwise send to portal (which redirects to discover if still no memberships).
    const [profileRes, membershipsRes] = await Promise.all([
      supabase.from("users").select("onboarding_step").eq("id", user.id).single(),
      supabase
        .from("club_memberships")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("deleted_at", null),
    ]);

    const onboardingDone = profileRes.data?.onboarding_step !== null;
    const hasMemberships = (membershipsRes.count ?? 0) > 0;

    if (onboardingDone && !hasMemberships) {
      return NextResponse.json({ destination: "/discover" });
    }

    return NextResponse.json({ destination: "/portal" });
  }

  const clubIds = staff.map((s) => s.club_id);

  const { data: clubsData, error: clubsError } = await supabase
    .from("clubs")
    .select("id, slug, name")
    .in("id", clubIds);

  if (clubsError || !clubsData || clubsData.length === 0) {
    return NextResponse.json({ destination: "/portal" });
  }

  const clubs = clubsData.map((club) => {
    const role = staff.find((s) => s.club_id === club.id)?.role;
    return { slug: club.slug, name: club.name, role };
  });

  if (clubs.length === 1) {
    const slug = clubs[0]?.slug;
    if (slug) {
      return NextResponse.json({ destination: `/${slug}/dashboard`, clubs });
    }
  }

  return NextResponse.json({ destination: "/clubs", clubs });
}
