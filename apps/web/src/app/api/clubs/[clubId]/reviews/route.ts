// /api/clubs/[clubId]/reviews  (clubId is the club slug — named clubId to match sibling routes)
// GET  — public, returns avgRating + paginated reviews
// POST — auth required, creates review (must be active/expired member)
// PATCH  — auth required, updates own review
// DELETE — auth required, soft-deletes own review

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { createServiceClient } from "@zenzo/database/client";

type RouteParams = { params: { clubId: string } };

// ─── GET — public ─────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const service = createServiceClient();

  const { data: club } = await service
    .from("clubs")
    .select("id, avg_rating")
    .eq("slug", params.clubId)
    .single();

  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: reviews, count } = await service
    .from("club_reviews")
    .select("id, rating, review_text, created_at, reviewer_user_id", { count: "exact" })
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const reviewerIds = (reviews ?? []).map((r) => r.reviewer_user_id);
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
    avgRating: club.avg_rating,
    count: count ?? 0,
    reviews: (reviews ?? []).map((r) => {
      const reviewer = reviewerMap.get(r.reviewer_user_id);
      return {
        id:         r.id,
        rating:     r.rating,
        reviewText: r.review_text,
        createdAt:  r.created_at,
        reviewer: {
          id:        r.reviewer_user_id,
          fullName:  reviewer?.full_name ?? "Member",
          avatarUrl: reviewer?.avatar_url ?? null,
        },
      };
    }),
  });
}

// ─── POST — auth required, membership check ───────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { rating?: unknown; reviewText?: unknown };
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 422 });
  }
  const reviewText =
    typeof body.reviewText === "string" ? body.reviewText.trim().slice(0, 500) || null : null;

  const service = createServiceClient();

  const { data: club } = await service
    .from("clubs")
    .select("id")
    .eq("slug", params.clubId)
    .single();
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await service
    .from("club_memberships")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .in("status", ["active", "expired"])
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "You must be a member of this club to leave a review" },
      { status: 403 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: review, error } = await admin
    .from("club_reviews")
    .insert({ club_id: club.id, reviewer_user_id: user.id, rating, review_text: reviewText })
    .select("id, rating, review_text, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}

// ─── PATCH — update own review ────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { rating?: unknown; reviewText?: unknown };
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

  const service = createServiceClient();
  const { data: club } = await service
    .from("clubs")
    .select("id")
    .eq("slug", params.clubId)
    .single();
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data: review, error } = await admin
    .from("club_reviews")
    .update(updateData)
    .eq("club_id", club.id)
    .eq("reviewer_user_id", user.id)
    .is("deleted_at", null)
    .select("id, rating, review_text, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({ review });
}

// ─── DELETE — soft-delete own review ─────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: club } = await service
    .from("clubs")
    .select("id")
    .eq("slug", params.clubId)
    .single();
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("club_reviews")
    .update({ deleted_at: new Date().toISOString() })
    .eq("club_id", club.id)
    .eq("reviewer_user_id", user.id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
