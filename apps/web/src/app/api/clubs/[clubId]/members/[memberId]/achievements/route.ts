// GET  /api/clubs/[clubId]/members/[memberId]/achievements
// POST /api/clubs/[clubId]/members/[memberId]/achievements
//
// [clubId] accepts UUID or slug.
// [memberId] is the membership id.
//
// GET  — returns all achievements for this member at this club (public-ish, staff auth required for the dashboard)
// POST — awards a new achievement; caller must be owner or coach of this club

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveClub } from "@/lib/resolve-club";
import { apiResponse } from "@/lib/api-response";
import { StaffRole, ACHIEVEMENT_TEMPLATES } from "@zenzo/database/enums";

const TEMPLATE_MAP = new Map<string, (typeof ACHIEVEMENT_TEMPLATES)[number]>(
  ACHIEVEMENT_TEMPLATES.map((t) => [t.slug, t])
);

export async function GET(
  _request: NextRequest,
  { params }: { params: { clubId: string; memberId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiResponse.unauthorized();

  const resolved = await resolveClub(supabase, params.clubId);
  if (!resolved) return apiResponse.notFound("Club not found.");

  const { clubId } = resolved;

  // Verify the caller is staff at this club
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .single();

  if (!staff) return apiResponse.forbidden();

  // memberId here is the membership id — resolve the user_id from it
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("user_id")
    .eq("id", params.memberId)
    .eq("club_id", clubId)
    .single();

  if (!membership) return apiResponse.notFound("Membership not found.");

  const { data: achievements } = await supabase
    .from("member_achievements")
    .select("id, title, description, badge_icon, awarded_at, awarded_by")
    .eq("user_id", membership.user_id)
    .eq("club_id", clubId)
    .order("awarded_at", { ascending: false });

  // Fetch awarder names in one query
  const awarderIds = [...new Set((achievements ?? []).map((a) => a.awarded_by).filter(Boolean))] as string[];
  let awarderMap: Record<string, string> = {};

  if (awarderIds.length > 0) {
    const { data: awarders } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", awarderIds);
    awarderMap = Object.fromEntries((awarders ?? []).map((u) => [u.id, u.full_name]));
  }

  return apiResponse.ok(
    (achievements ?? []).map((a) => ({
      ...a,
      awardedByName: a.awarded_by ? (awarderMap[a.awarded_by] ?? null) : null,
    }))
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string; memberId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiResponse.unauthorized();

  const resolved = await resolveClub(supabase, params.clubId);
  if (!resolved) return apiResponse.notFound("Club not found.");

  const { clubId } = resolved;

  // Must be owner or coach
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .in("role", [StaffRole.Owner, StaffRole.Coach])
    .single();

  if (!staff) return apiResponse.forbidden();

  const body = await request.json() as {
    title: string;
    description?: string;
    badgeIcon?: string;
    awardedAt?: string;
  };

  if (!body.title?.trim()) {
    return apiResponse.badRequest("title is required.");
  }

  // memberId is the membership id — resolve user_id
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("user_id")
    .eq("id", params.memberId)
    .eq("club_id", clubId)
    .single();

  if (!membership) return apiResponse.notFound("Membership not found.");

  // Auto-fill icon from template if title matches a slug
  const template = TEMPLATE_MAP.get(body.title.toLowerCase().replace(/\s+/g, "_"));
  const badgeIcon = body.badgeIcon ?? template?.icon ?? null;

  const { data: achievement, error } = await supabase
    .from("member_achievements")
    .insert({
      user_id:    membership.user_id,
      club_id:    clubId,
      title:      body.title.trim(),
      description: body.description?.trim() ?? null,
      badge_icon:  badgeIcon,
      awarded_by:  user.id,
      awarded_at:  body.awardedAt ?? new Date().toISOString().slice(0, 10),
    })
    .select("id, title, description, badge_icon, awarded_at, awarded_by")
    .single();

  if (error) {
    console.error("[achievements/POST]", error);
    return apiResponse.serverError("Failed to award achievement.");
  }

  return NextResponse.json(achievement, { status: 201 });
}
