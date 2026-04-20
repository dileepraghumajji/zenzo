// Server-side auth utilities — used in layouts and server components only.
// Never import this file in client components ("use client").
//
// Call site:
//   [clubSlug]/layout.tsx → getUserProfile(clubSlug)
//     → passes {role, fullName, initials} as props to Sidebar + BottomNav
//
// Re-trigger:
//   Automatic: layout re-runs on every navigation (Next.js App Router)
//   Manual:    client calls router.refresh() after a role change
//
// Note on select():
//   Use explicit column lists. select("*") returns the empty type {} with
//   hand-written DB types (it only resolves to Row with auto-generated types).

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import type { StaffRole } from "@zenzo/database/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClubStub {
  slug: string;
  name: string;
  role: StaffRole;
}

export interface UserProfile {
  userId: string;
  role: StaffRole;
  fullName: string;
  initials: string;
  clubId: string;
  allClubs: ClubStub[];
}

// ─── getUserProfile ───────────────────────────────────────────────────────────
// Fetches role + display info for the authenticated user within a given club.
// Called ONCE per navigation in [clubSlug]/layout.tsx.
// Result flows DOWN as props — pages and client components never call this.
//
// Redirect cases:
//   No session            → /login  (cookie expired)
//   User not in club      → /login  (wrong slug or not a staff member)
//   Club slug not found   → /login

export async function getUserProfile(clubSlug: string): Promise<UserProfile> {
  // Create the client directly so TypeScript preserves the full Database generic.
  // Destructuring from a helper loses the exact type — query results become never.
  const supabase = createSupabaseServerClient();

  // Validate session — getUser() hits the Supabase auth server (not just local cookie).
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // Fetch the club by slug to get its id.
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) redirect("/login");

  // Verify the user is staff (owner or coach) for this club.
  const { data: staff, error: staffError } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (staffError || !staff) redirect("/login");

  // Fetch display info from the users table.
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (userError || !userRow) redirect("/login");

  // Derive initials safely (noUncheckedIndexedAccess: true in tsconfig)
  const parts = (userRow.full_name ?? "").trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last  = parts[parts.length - 1] ?? "";
  const initials =
    ((first[0] ?? "") + (last !== first ? (last[0] ?? "") : "")).toUpperCase() || "?";

  // Fetch all clubs this user belongs to for the club switcher.
  const { data: allStaff } = await supabase
    .from("club_staff")
    .select("role, club_id")
    .eq("user_id", user.id);

  let allClubs: ClubStub[] = [];
  if (allStaff && allStaff.length > 0) {
    const clubIds = allStaff.map((s) => s.club_id);
    const { data: clubRows } = await supabase
      .from("clubs")
      .select("id, slug, name")
      .in("id", clubIds)
      .order("name");

    if (clubRows) {
      allClubs = clubRows.map((c) => ({
        slug: c.slug,
        name: c.name,
        role: (allStaff.find((s) => s.club_id === c.id)?.role ?? "coach") as StaffRole,
      }));
    }
  }

  return {
    userId:   user.id,
    role:     staff.role,
    fullName: userRow.full_name ?? "User",
    initials,
    clubId:   club.id,
    allClubs,
  };
}
