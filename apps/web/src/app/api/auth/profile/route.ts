// POST /api/auth/profile
//
// Called by the login page AFTER Supabase signInWithPassword() succeeds.
// Returns the user's clubs so the login page can redirect to
// /:clubSlug/dashboard or /clubs.
//
// Why a route handler and not a server action?
// The login page is a client component (handles form input + submission).
// Client components can't call server-only code directly. This is the bridge.
//
// Flow:
//   1. Login page: supabase.auth.signInWithPassword() → session cookie set
//   2. Login page: POST /api/auth/profile
//   3. This handler: reads session → queries club_staff + clubs → { clubs }
//   4. Login page: router.push("/${clubSlug}/dashboard") or "/clubs"

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
  const { data: staff, error: staffError } = await supabase
    .from("club_staff")
    .select("role, club_id")
    .eq("user_id", user.id);

  if (staffError || !staff || staff.length === 0) {
    return NextResponse.json({ error: "No club membership found" }, { status: 404 });
  }

  const clubIds = staff.map((s) => s.club_id);

  const { data: clubsData, error: clubsError } = await supabase
    .from("clubs")
    .select("id, slug, name")
    .in("id", clubIds);

  if (clubsError || !clubsData || clubsData.length === 0) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const clubs = clubsData.map((club) => {
    const role = staff.find((s) => s.club_id === club.id)?.role;
    return {
      slug: club.slug,
      name: club.name,
      role: role,
    };
  });

  return NextResponse.json({ clubs });
}
