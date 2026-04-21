// /api/coaches/[userId]/ratings
// GET  — public, returns avgRating + paginated ratings
// POST — auth required, creates rating (must have trained with this coach in a batch)
// PATCH  — auth required, updates own rating (body includes clubId)
// DELETE — auth required, soft-deletes own rating (?clubId=)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { createServiceClient } from "@zenzo/database/client";

type RouteParams = { params: { userId: string } };

// ─── GET — public ─────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const service = createServiceClient();

  // All ratings for avg calculation
  const { data: allRatings } = await service
    .from("coach_ratings")
    .select("rating")
    .eq("coach_user_id", params.userId)
    .is("deleted_at", null);

  const avgRating =
    allRatings && allRatings.length > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
      : null;
  const count = allRatings?.length ?? 0;

  // Recent 10 for display
  const { data: ratings } = await service
    .from("coach_ratings")
    .select("id, rating, review_text, created_at, reviewer_user_id, club_id")
    .eq("coach_user_id", params.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const reviewerIds = (ratings ?? []).map((r) => r.reviewer_user_id);
  let reviewerMap = new Map<string, { full_name: string; avatar_url: string | null }>();
  if (reviewerIds.length > 0) {
    const { data: users } = await service
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", reviewerIds);
    reviewerMap = new Map(
      (users ?? []).map((u) => [u.id, { full_name: u.full_name, avatar_url: u.avatar_url }])
    );
  }

  return NextResponse.json({
    avgRating,
    count,
    ratings: (ratings ?? []).map((r) => {
      const reviewer = reviewerMap.get(r.reviewer_user_id);
      return {
        id:         r.id,
        rating:     r.rating,
        reviewText: r.review_text,
        createdAt:  r.created_at,
        clubId:     r.club_id,
        reviewer: {
          id:        r.reviewer_user_id,
          fullName:  reviewer?.full_name ?? "Member",
          avatarUrl: reviewer?.avatar_url ?? null,
        },
      };
    }),
  });
}

// ─── POST — auth required, batch assignment check ─────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { rating?: unknown; reviewText?: unknown; clubId?: unknown };
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 422 });
  }
  const clubId = typeof body.clubId === "string" ? body.clubId : null;
  if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 422 });

  const reviewText =
    typeof body.reviewText === "string" ? body.reviewText.trim().slice(0, 500) || null : null;

  const service = createServiceClient();

  // Find user's membership at this club
  const { data: membership } = await service
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .not("status", "eq", "deleted")
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this club" }, { status: 403 });
  }

  // Check that user has a batch with this coach
  const { data: memberBatches } = await service
    .from("member_batches")
    .select("batch_id")
    .eq("membership_id", membership.id);

  const batchIds = (memberBatches ?? []).map((mb) => mb.batch_id);

  if (batchIds.length > 0) {
    const { data: coachBatch } = await service
      .from("batches")
      .select("id")
      .eq("coach_id", params.userId)
      .in("id", batchIds)
      .maybeSingle();

    if (!coachBatch) {
      return NextResponse.json(
        { error: "You have no classes with this coach at this club" },
        { status: 403 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "You have no batch assignments at this club" },
      { status: 403 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: ratingRow, error } = await admin
    .from("coach_ratings")
    .insert({
      coach_user_id:    params.userId,
      club_id:          clubId,
      reviewer_user_id: user.id,
      rating,
      review_text:      reviewText,
    })
    .select("id, rating, review_text, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_rated" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rating: ratingRow }, { status: 201 });
}

// ─── PATCH — update own rating ────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { rating?: unknown; reviewText?: unknown; clubId?: unknown };
  const clubId = typeof body.clubId === "string" ? body.clubId : null;
  if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 422 });

  const updateData: {
    rating?: number;
    review_text?: string | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };

  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 422 });
    }
    updateData.rating = rating;
  }
  if (body.reviewText !== undefined) {
    updateData.review_text =
      typeof body.reviewText === "string" ? body.reviewText.trim().slice(0, 500) || null : null;
  }

  const admin = createSupabaseAdminClient();
  const { data: ratingRow, error } = await admin
    .from("coach_ratings")
    .update(updateData)
    .eq("coach_user_id", params.userId)
    .eq("club_id", clubId)
    .eq("reviewer_user_id", user.id)
    .is("deleted_at", null)
    .select("id, rating, review_text, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ratingRow) return NextResponse.json({ error: "Rating not found" }, { status: 404 });

  return NextResponse.json({ rating: ratingRow });
}

// ─── DELETE — soft-delete own rating ─────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");
  if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 422 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("coach_ratings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("coach_user_id", params.userId)
    .eq("club_id", clubId)
    .eq("reviewer_user_id", user.id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
