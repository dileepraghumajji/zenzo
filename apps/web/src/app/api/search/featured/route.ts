// GET /api/search/featured
// Public endpoint. No auth required.
// Returns up to 8 featured verified clubs.
// Used for the landing/discovery carousel when no search query is active.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerificationStatus } from "@zenzo/database";

export const revalidate = 300; // 5-minute ISR cache

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clubs")
    .select(
      "id, slug, name, tagline, cover_image_url, business_type, subcategories, area, city, avg_rating, review_count, starting_price_paise, price_range, featured, member_count"
    )
    .eq("featured", true)
    .eq("listed", true)
    .eq("verification_status", VerificationStatus.Verified)
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("member_count", { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clubs = (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline ?? null,
    cover_image_url: c.cover_image_url ?? null,
    business_type: c.business_type,
    subcategories: c.subcategories ?? [],
    area: c.area ?? null,
    city: c.city ?? null,
    avg_rating: c.avg_rating ?? null,
    review_count: c.review_count,
    starting_price_paise: c.starting_price_paise ?? null,
    price_range: c.price_range ?? null,
    member_count: c.member_count,
  }));

  return NextResponse.json({ clubs });
}
