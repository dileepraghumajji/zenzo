// resolveClub — resolves a club UUID or slug to the club's UUID.
//
// Many route handlers receive [clubId] which may be either a UUID or a slug
// (the dashboard uses slugs in URLs but some callers pass UUIDs).
// Use this instead of duplicating the pattern in every handler.
//
// Usage:
//   const club = await resolveClub(supabase, params.clubId);
//   if (!club) return apiResponse.notFound("Club not found.");
//   const { clubId } = club;

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@zenzo/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveClub(
  supabase: SupabaseClient<Database>,
  identifier: string
): Promise<{ clubId: string } | null> {
  const isUuid = UUID_RE.test(identifier);
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq(isUuid ? "id" : "slug", identifier)
    .single();

  return club ? { clubId: club.id } : null;
}
