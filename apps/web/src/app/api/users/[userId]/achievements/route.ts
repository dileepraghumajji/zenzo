// GET /api/users/[userId]/achievements
//
// Public endpoint — no auth required.
// Returns all achievements for a user across all clubs, ordered by awarded_at DESC.
// Includes club name for context.

import { NextRequest } from "next/server";
import { createServiceClient } from "@zenzo/database/client";
import { apiResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const supabase = createServiceClient();

  const { data: achievements } = await supabase
    .from("member_achievements")
    .select("id, title, description, badge_icon, awarded_at, club_id")
    .eq("user_id", params.userId)
    .order("awarded_at", { ascending: false });

  if (!achievements || achievements.length === 0) {
    return apiResponse.ok([]);
  }

  const clubIds = [...new Set(achievements.map((a) => a.club_id))];
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .in("id", clubIds);

  const clubMap = Object.fromEntries((clubs ?? []).map((c) => [c.id, c]));

  return apiResponse.ok(
    achievements.map((a) => ({
      id:          a.id,
      title:       a.title,
      description: a.description,
      badgeIcon:   a.badge_icon,
      awardedAt:   a.awarded_at,
      club:        clubMap[a.club_id]
        ? { name: clubMap[a.club_id]!.name, slug: clubMap[a.club_id]!.slug }
        : null,
    }))
  );
}
