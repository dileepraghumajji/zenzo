// GET /api/batches/[batchId]/eligible-members?clubSlug=xxx
//
// Returns active club members not already in this batch.
// Used by the AddMemberDialog in batch detail.
//
// Returns: { members: ClubMemberOption[] }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipStatus } from "@zenzo/database/enums";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const { batchId } = params;
  const clubSlug = request.nextUrl.searchParams.get("clubSlug") ?? "";

  // ── 1. Auth ─────────────────────────────────────────────────────────────
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── 2. Resolve club ───────────────────────────────────────────────────────
  if (!clubSlug) {
    return NextResponse.json({ error: "clubSlug is required" }, { status: 400 });
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // ── 3. Verify caller is staff ─────────────────────────────────────────────
  const { data: staffRow } = await supabase
    .from("club_staff")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 4. Members already in this batch ─────────────────────────────────────
  const { data: batchMembers } = await supabase
    .from("member_batches")
    .select("membership_id")
    .eq("batch_id", batchId);

  const alreadyIn = new Set((batchMembers ?? []).map((mb) => mb.membership_id));

  // ── 5. Active memberships for this club ───────────────────────────────────
  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("id, user_id, status")
    .eq("club_id", club.id)
    .in("status", [MembershipStatus.Active, MembershipStatus.Overdue])
    .is("deleted_at", null);

  const eligible = (memberships ?? []).filter((m) => !alreadyIn.has(m.id));

  if (eligible.length === 0) {
    return NextResponse.json({ members: [] });
  }

  // ── 6. Fetch user names + phones ──────────────────────────────────────────
  const userIds = eligible.map((m) => m.user_id);

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, phone")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const members = eligible
    .map((m) => {
      const u = userMap.get(m.user_id);
      if (!u) return null;
      return {
        membershipId: m.id,
        userId:       m.user_id,
        fullName:     u.full_name,
        phone:        u.phone,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return NextResponse.json({ members });
}
