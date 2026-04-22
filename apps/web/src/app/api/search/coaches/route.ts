// GET /api/search/coaches
// Public endpoint. No auth required.
// Coach search: users with club_staff.role = 'coach', with full filter + cursor pagination.
//
// Two-step query pattern:
//  1. Get all coach user_ids from club_staff (max 500 — sufficient for platform scale)
//  2. Query users filtered to those ids + all search params
//  3. Batch-fetch affiliated clubs and compute avg_rating from coach_ratings

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffRole } from "@zenzo/database";

const PAGE_SIZE = 20;
const MAX_COACH_IDS = 500;

type Cursor = { offset: number };

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset })).toString("base64url");
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (typeof parsed?.offset !== "number") return null;
    return parsed as Cursor;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawQ = searchParams.get("q") ?? "";
  const q = rawQ.trim().replace(/[,*'\\]/g, "");

  const specializations = (searchParams.get("specializations") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const availability = searchParams.get("availability"); // 'available' | 'busy'

  const rawMinRating = searchParams.get("min_rating");
  const minRating = rawMinRating !== null ? parseFloat(rawMinRating) : null;
  if (minRating !== null && (isNaN(minRating) || minRating < 0 || minRating > 5)) {
    return NextResponse.json({ error: "Invalid min_rating" }, { status: 400 });
  }

  const rawMaxPrice = searchParams.get("max_price_paise");
  const maxPricePaise = rawMaxPrice !== null ? parseInt(rawMaxPrice) : null;
  if (maxPricePaise !== null && isNaN(maxPricePaise)) {
    return NextResponse.json({ error: "Invalid max_price_paise" }, { status: 400 });
  }

  const rawCursor = searchParams.get("cursor");
  const cursor = rawCursor ? decodeCursor(rawCursor) : null;
  const offset = cursor?.offset ?? 0;

  const supabase = createSupabaseServerClient();

  // Step 1: Get all coach user_ids
  const { data: coachStaff } = await supabase
    .from("club_staff")
    .select("user_id")
    .eq("role", StaffRole.Coach)
    .limit(MAX_COACH_IDS);

  const coachUserIds = [...new Set((coachStaff ?? []).map((s) => s.user_id))];

  if (coachUserIds.length === 0) {
    return NextResponse.json({ coaches: [], total: 0, nextCursor: null, hasMore: false });
  }

  // Step 2: Query users with filters
  let userQuery = supabase
    .from("users")
    .select(
      "id, full_name, username, avatar_url, bio, specializations, certifications, experience_years, languages, session_price_paise, is_available, is_freelance, city",
      { count: "exact" }
    )
    .in("id", coachUserIds);

  if (q) userQuery = userQuery.ilike("full_name", `%${q}%`);
  if (specializations.length > 0) userQuery = userQuery.overlaps("specializations", specializations);
  if (availability === "available") userQuery = userQuery.eq("is_available", true);
  if (availability === "busy") userQuery = userQuery.eq("is_available", false);
  if (maxPricePaise !== null) userQuery = userQuery.lte("session_price_paise", maxPricePaise);

  userQuery = userQuery.order("full_name").range(offset, offset + PAGE_SIZE - 1);

  const { data: users, count, error: userError } = await userQuery;

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const foundUsers = users ?? [];

  if (foundUsers.length === 0) {
    return NextResponse.json({ coaches: [], total: count ?? 0, nextCursor: null, hasMore: false });
  }

  const foundUserIds = foundUsers.map((u) => u.id);

  // Step 3: Batch-fetch affiliated clubs + ratings in parallel
  const [{ data: staffRows }, { data: ratingRows }] = await Promise.all([
    supabase
      .from("club_staff")
      .select("user_id, clubs(name, slug, city, area)")
      .eq("role", StaffRole.Coach)
      .in("user_id", foundUserIds),
    supabase
      .from("coach_ratings")
      .select("coach_user_id, rating")
      .in("coach_user_id", foundUserIds)
      .is("deleted_at", null),
  ]);

  // Build clubs map per coach
  type ClubRef = { name: string; slug: string };
  const coachClubsMap: Record<string, ClubRef[]> = {};
  for (const row of staffRows ?? []) {
    const club = row.clubs as ClubRef | null;
    if (!club) continue;
    coachClubsMap[row.user_id] = [...(coachClubsMap[row.user_id] ?? []), club];
  }

  // Compute avg_rating per coach
  const ratingAccum: Record<string, { sum: number; count: number }> = {};
  for (const r of ratingRows ?? []) {
    const acc = ratingAccum[r.coach_user_id] ?? { sum: 0, count: 0 };
    acc.sum += r.rating;
    acc.count += 1;
    ratingAccum[r.coach_user_id] = acc;
  }

  // Build response + apply in-memory min_rating filter
  const coaches = foundUsers
    .map((u) => {
      const acc = ratingAccum[u.id];
      const avgRating = acc && acc.count > 0 ? acc.sum / acc.count : null;
      const reviewCount = acc?.count ?? 0;
      return {
        user_id: u.id,
        username: u.username,
        display_name: u.full_name,
        avatar_url: u.avatar_url ?? null,
        bio: u.bio ?? null,
        specializations: u.specializations ?? [],
        certifications: u.certifications ?? [],
        experience_years: u.experience_years ?? null,
        languages: u.languages ?? [],
        session_price_paise: u.session_price_paise ?? null,
        is_available: u.is_available,
        is_freelance: u.is_freelance,
        city: u.city ?? null,
        avg_rating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null,
        review_count: reviewCount,
        clubs: coachClubsMap[u.id] ?? [],
        distance_km: null, // populated when geo RPC is implemented
      };
    })
    .filter((c) => minRating === null || (c.avg_rating !== null && c.avg_rating >= minRating));

  const total = count ?? 0;
  const hasMore = offset + PAGE_SIZE < total;
  const nextCursor = hasMore ? encodeCursor(offset + PAGE_SIZE) : null;

  return NextResponse.json({ coaches, total, nextCursor, hasMore });
}
