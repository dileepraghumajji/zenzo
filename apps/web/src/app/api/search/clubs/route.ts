// GET /api/search/clubs
// Public endpoint. No auth required.
// Full-text + filter + cursor-paginated club search.
//
// Geo-search (lat/lng/radius_km) is accepted and parsed.
// Distance sort falls back to relevance until a PostGIS RPC is added (see SD2.5).

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClubCategory, PriceRange, VerificationStatus } from "@zenzo/database";

const PAGE_SIZE = 20;

const VALID_SORTS = [
  "relevance",
  "distance",
  "rating",
  "price_asc",
  "price_desc",
  "popularity",
  "newest",
] as const;
type SortOption = (typeof VALID_SORTS)[number];

const VALID_CATEGORIES = Object.values(ClubCategory) as string[];
const VALID_PRICE_RANGES = Object.values(PriceRange) as string[];

type Cursor = { id: string; sortValue: string | number | null };

function encodeCursor(id: string, sortValue: string | number | null): string {
  return Buffer.from(JSON.stringify({ id, sortValue })).toString("base64url");
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (typeof parsed?.id !== "string") return null;
    return parsed as Cursor;
  } catch {
    return null;
  }
}

function parseLocationWkt(wkt: string | null): { lat: number; lng: number } | null {
  if (!wkt) return null;
  const match = wkt.match(/POINT\(([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\)/);
  if (!match) return null;
  const [, lngStr, latStr] = match;
  if (!lngStr || !latStr) return null;
  return { lng: parseFloat(lngStr), lat: parseFloat(latStr) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Sanitize free-text query — strip chars that break PostgREST filter syntax
  const rawQ = searchParams.get("q") ?? "";
  const q = rawQ.trim().replace(/[,*'\\]/g, "");

  const category = searchParams.get("category");
  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const subcategories = (searchParams.get("subcategories") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const amenities = (searchParams.get("amenities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const priceRange = searchParams.get("price_range");
  if (priceRange && !VALID_PRICE_RANGES.includes(priceRange)) {
    return NextResponse.json({ error: "Invalid price_range" }, { status: 400 });
  }

  const rawMinRating = searchParams.get("min_rating");
  const minRating = rawMinRating !== null ? parseFloat(rawMinRating) : null;
  if (minRating !== null && (isNaN(minRating) || minRating < 0 || minRating > 5)) {
    return NextResponse.json({ error: "Invalid min_rating" }, { status: 400 });
  }

  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const lat = rawLat !== null ? parseFloat(rawLat) : null;
  const lng = rawLng !== null ? parseFloat(rawLng) : null;
  const hasGeo = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  const rawSort = searchParams.get("sort") ?? "relevance";
  if (!VALID_SORTS.includes(rawSort as SortOption)) {
    return NextResponse.json({ error: "Invalid sort" }, { status: 400 });
  }
  // distance sort requires geo-search RPC — fall back to relevance until implemented
  const sort: SortOption = rawSort === "distance" && !hasGeo ? "relevance" : (rawSort as SortOption);

  const rawCursor = searchParams.get("cursor");
  const cursor = rawCursor ? decodeCursor(rawCursor) : null;

  const supabase = createSupabaseServerClient();

  const CLUB_SELECT =
    "id, slug, name, tagline, cover_image_url, business_type, subcategories, amenities, area, city, avg_rating, review_count, starting_price_paise, price_range, featured, verification_status, operating_hours, member_count, location, created_at";

  // ── Count query (no cursor, no sort) ──────────────────────────────────────

  let countQuery = supabase
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .eq("listed", true)
    .eq("verification_status", VerificationStatus.Verified);

  if (q.length >= 2) {
    countQuery = countQuery.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  } else if (q.length === 1) {
    countQuery = countQuery.ilike("name", `%${q}%`);
  }

  if (category) countQuery = countQuery.eq("business_type", category as ClubCategory);
  if (subcategories.length > 0) countQuery = countQuery.overlaps("subcategories", subcategories);
  if (amenities.length > 0) countQuery = countQuery.contains("amenities", amenities);
  if (priceRange) countQuery = countQuery.eq("price_range", priceRange as PriceRange);
  if (minRating !== null) countQuery = countQuery.gte("avg_rating", minRating);

  // ── Data query ────────────────────────────────────────────────────────────

  let dataQuery = supabase
    .from("clubs")
    .select(CLUB_SELECT)
    .eq("listed", true)
    .eq("verification_status", VerificationStatus.Verified);

  if (q.length >= 2) {
    dataQuery = dataQuery.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  } else if (q.length === 1) {
    dataQuery = dataQuery.ilike("name", `%${q}%`);
  }

  if (category) dataQuery = dataQuery.eq("business_type", category as ClubCategory);
  if (subcategories.length > 0) dataQuery = dataQuery.overlaps("subcategories", subcategories);
  if (amenities.length > 0) dataQuery = dataQuery.contains("amenities", amenities);
  if (priceRange) dataQuery = dataQuery.eq("price_range", priceRange as PriceRange);
  if (minRating !== null) dataQuery = dataQuery.gte("avg_rating", minRating);

  // ── Sorting + keyset cursor ────────────────────────────────────────────────

  switch (sort) {
    case "rating": {
      if (cursor) {
        const sv = cursor.sortValue;
        if (sv !== null) {
          dataQuery = dataQuery.or(
            `avg_rating.lt.${sv},and(avg_rating.eq.${sv},id.gt.${cursor.id})`
          );
        } else {
          dataQuery = dataQuery.gt("id", cursor.id);
        }
      }
      dataQuery = dataQuery
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .order("id");
      break;
    }
    case "price_asc": {
      if (cursor) {
        const sv = cursor.sortValue;
        if (sv !== null) {
          dataQuery = dataQuery.or(
            `starting_price_paise.gt.${sv},and(starting_price_paise.eq.${sv},id.gt.${cursor.id})`
          );
        } else {
          dataQuery = dataQuery.gt("id", cursor.id);
        }
      }
      dataQuery = dataQuery
        .order("starting_price_paise", { ascending: true, nullsFirst: false })
        .order("id");
      break;
    }
    case "price_desc": {
      if (cursor) {
        const sv = cursor.sortValue;
        if (sv !== null) {
          dataQuery = dataQuery.or(
            `starting_price_paise.lt.${sv},and(starting_price_paise.eq.${sv},id.gt.${cursor.id})`
          );
        } else {
          dataQuery = dataQuery.gt("id", cursor.id);
        }
      }
      dataQuery = dataQuery
        .order("starting_price_paise", { ascending: false, nullsFirst: false })
        .order("id");
      break;
    }
    case "popularity": {
      if (cursor) {
        const sv = cursor.sortValue;
        if (sv !== null) {
          dataQuery = dataQuery.or(
            `member_count.lt.${sv},and(member_count.eq.${sv},id.gt.${cursor.id})`
          );
        } else {
          dataQuery = dataQuery.gt("id", cursor.id);
        }
      }
      dataQuery = dataQuery.order("member_count", { ascending: false }).order("id");
      break;
    }
    case "newest": {
      if (cursor) {
        const sv = cursor.sortValue;
        if (sv !== null) {
          dataQuery = dataQuery.or(
            `created_at.lt.${sv},and(created_at.eq.${sv},id.gt.${cursor.id})`
          );
        } else {
          dataQuery = dataQuery.gt("id", cursor.id);
        }
      }
      dataQuery = dataQuery.order("created_at", { ascending: false }).order("id");
      break;
    }
    default: {
      // relevance + distance (distance falls back to relevance)
      if (cursor) {
        dataQuery = dataQuery.gt("id", cursor.id);
      }
      dataQuery = dataQuery
        .order("featured", { ascending: false })
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .order("member_count", { ascending: false })
        .order("id");
    }
  }

  dataQuery = dataQuery.limit(PAGE_SIZE + 1);

  // ── Execute both queries in parallel ──────────────────────────────────────

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const clubs = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  // Build next cursor from the last returned row
  let nextCursor: string | null = null;
  if (hasMore) {
    const last = clubs.at(-1);
    if (last) {
      let sortValue: string | number | null = null;
      switch (sort) {
        case "rating":
          sortValue = last.avg_rating;
          break;
        case "price_asc":
        case "price_desc":
          sortValue = last.starting_price_paise;
          break;
        case "popularity":
          sortValue = last.member_count;
          break;
        case "newest":
          sortValue = last.created_at;
          break;
      }
      nextCursor = encodeCursor(last.id, sortValue);
    }
  }

  const result = clubs.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline ?? null,
    cover_image_url: c.cover_image_url ?? null,
    business_type: c.business_type,
    subcategories: c.subcategories ?? [],
    amenities: (c.amenities ?? []).slice(0, 4),
    area: c.area ?? null,
    city: c.city ?? null,
    avg_rating: c.avg_rating ?? null,
    review_count: c.review_count,
    starting_price_paise: c.starting_price_paise ?? null,
    price_range: c.price_range ?? null,
    is_verified: c.verification_status === VerificationStatus.Verified,
    featured: c.featured,
    operating_hours: c.operating_hours ?? null,
    member_count: c.member_count,
    location: parseLocationWkt(c.location as string | null),
    distance_km: null, // populated when PostGIS geo RPC is implemented (SD2.5)
  }));

  return NextResponse.json({
    clubs: result,
    total: count ?? 0,
    nextCursor,
    hasMore,
  });
}
