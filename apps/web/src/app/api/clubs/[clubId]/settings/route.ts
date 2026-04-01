// PATCH /api/clubs/[clubId]/settings
//
// Updates the club's business profile.
// [clubId] param accepts either a UUID or a slug.
//
// Body: { name, city?, phone?, business_type }
// Returns: { success: true }

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveClub } from "@/lib/resolve-club";
import { apiResponse } from "@/lib/api-response";
import { ClubCategory, StaffRole } from "@zenzo/database/enums";
import type { Json } from "@zenzo/database";

const VALID_CATEGORIES = new Set<string>(Object.values(ClubCategory));

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiResponse.unauthorized();

  const body = await request.json();
  const { name, city, phone, business_type, logo_url, terminology_patch } = body;

  if (!name && logo_url === undefined && !terminology_patch) {
    return apiResponse.badRequest("Nothing to update.");
  }
  if (name !== undefined && !name?.trim()) {
    return apiResponse.badRequest("Club name is required.");
  }
  if (business_type && !VALID_CATEGORIES.has(business_type)) {
    return apiResponse.badRequest("Invalid category.");
  }

  // Resolve club — param may be UUID or slug
  const resolved = await resolveClub(supabase, params.clubId);
  if (!resolved) return apiResponse.notFound("Club not found.");

  // Fetch terminology for merge
  const { data: club } = await supabase
    .from("clubs")
    .select("id, terminology")
    .eq("id", resolved.clubId)
    .single();

  if (!club) return apiResponse.notFound("Club not found.");

  // Caller must be owner
  const { data: staff } = await supabase
    .from("club_staff")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .eq("role", StaffRole.Owner)
    .single();

  if (!staff) return apiResponse.forbidden();

  // Build update payload
  type ClubUpdate = {
    name?: string;
    city?: string | null;
    phone?: string | null;
    business_type?: ClubCategory;
    logo_url?: string | null;
    terminology?: Json;
  };

  const update: ClubUpdate = {};

  if (name)               update.name          = name.trim();
  if (city !== undefined) update.city          = city?.trim() || null;
  if (phone !== undefined) update.phone        = phone?.trim() || null;
  if (business_type)      update.business_type = business_type as ClubCategory;
  if (logo_url !== undefined) update.logo_url  = logo_url;

  if (terminology_patch && typeof terminology_patch === "object") {
    const existing = (club.terminology ?? {}) as Record<string, unknown>;
    update.terminology = { ...existing, ...terminology_patch };
  }

  const { error } = await supabase
    .from("clubs")
    .update(update)
    .eq("id", club.id);

  if (error) return apiResponse.serverError(error.message);

  return apiResponse.ok({ success: true });
}
