// /coaches/[userId] — public coach profile
// No auth required.

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@zenzo/database/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffRole } from "@zenzo/database/enums";
import { StarRating } from "@zenzo/ui";
import type { DayOfWeek } from "@zenzo/database";
import { WriteRatingButton } from "./_components/write-rating-button";

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed",
  thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  if (!h || !m) return time;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}): Promise<Metadata> {
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", params.userId)
    .maybeSingle();

  if (!user) return { title: "Coach | Zenzo" };

  const { data: staffRows } = await supabase
    .from("club_staff")
    .select("club_id")
    .eq("user_id", params.userId)
    .eq("role", StaffRole.Coach)
    .limit(1);

  const clubId = staffRows?.[0]?.club_id;
  let clubName = "";
  if (clubId) {
    const { data: club } = await supabase.from("clubs").select("name").eq("id", clubId).single();
    clubName = club?.name ?? "";
  }

  return {
    title: `${user.full_name} — Coach at ${clubName} | Zenzo`,
    openGraph: {
      title: `${user.full_name} — Coach | Zenzo`,
      description: `Train with ${user.full_name} on Zenzo`,
    },
  };
}

export default async function CoachProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const service = createServiceClient();

  const { data: coach } = await service
    .from("users")
    .select("id, full_name, bio, avatar_url, city, created_at")
    .eq("id", params.userId)
    .maybeSingle();

  if (!coach) notFound();

  const { data: staffRows } = await service
    .from("club_staff")
    .select("club_id, role")
    .eq("user_id", params.userId)
    .eq("role", StaffRole.Coach);

  if (!staffRows || staffRows.length === 0) notFound();

  const clubIds = staffRows.map((s) => s.club_id);

  // Fetch clubs, batches, ratings in parallel
  const [{ data: clubs }, { data: batches }, { data: allRatings }, { data: recentRatings }] =
    await Promise.all([
      service.from("clubs").select("id, name, slug, city, phone").in("id", clubIds),
      service
        .from("batches")
        .select("id, name, start_time, end_time, days, club_id")
        .eq("coach_id", params.userId)
        .in("club_id", clubIds)
        .order("name", { ascending: true }),
      service
        .from("coach_ratings")
        .select("rating")
        .eq("coach_user_id", params.userId)
        .is("deleted_at", null),
      service
        .from("coach_ratings")
        .select("id, rating, review_text, created_at, reviewer_user_id, club_id")
        .eq("coach_user_id", params.userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));

  // Avg rating
  const avgRating =
    allRatings && allRatings.length > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
      : null;
  const ratingCount = allRatings?.length ?? 0;

  // Reviewer names for recent ratings
  const reviewerIds = (recentRatings ?? []).map((r) => r.reviewer_user_id);
  let reviewerMap = new Map<string, string>();
  if (reviewerIds.length > 0) {
    const { data: reviewUsers } = await service
      .from("users")
      .select("id, full_name")
      .in("id", reviewerIds);
    reviewerMap = new Map((reviewUsers ?? []).map((u) => [u.id, u.full_name]));
  }

  // Optional: check if current user is signed in (public page — no redirect on failure)
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  let userRating: { rating: number; reviewText: string | null; clubId: string } | null = null;
  if (user) {
    const { data } = await service
      .from("coach_ratings")
      .select("rating, review_text, club_id")
      .eq("coach_user_id", params.userId)
      .eq("reviewer_user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) {
      userRating = { rating: data.rating, reviewText: data.review_text, clubId: data.club_id };
    }
  }

  const initials = coach.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const clubNames = (clubs ?? []).map((c) => c.name).join(", ");
  const coachingSince = new Date(coach.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface-raised">
        <div className="max-w-lg mx-auto px-4 py-3">
          <Link href="/explore" className="text-caption text-muted hover:text-brand transition-colors">
            ← Explore
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          {coach.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coach.avatar_url}
              alt={coach.full_name}
              className="size-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="size-20 rounded-full bg-primary flex items-center justify-center text-h2 font-bold text-primary-foreground">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-h2 font-bold text-heading">{coach.full_name}</h1>
            <p className="text-body text-muted">Coach at {clubNames}</p>
            <p className="text-caption text-muted mt-1">On Zenzo since {coachingSince}</p>
            {avgRating && (
              <div className="flex items-center gap-1.5 mt-2">
                <StarRating value={avgRating} size="sm" />
                <span className="text-caption text-muted font-medium">
                  {avgRating.toFixed(1)} ({ratingCount})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {coach.bio && (
          <div className="bg-surface-raised border border-border rounded-xl p-4">
            <p className="text-body text-muted">{coach.bio}</p>
          </div>
        )}

        {/* Batches */}
        {batches && batches.length > 0 && (
          <div className="space-y-3">
            <p className="text-label text-muted uppercase tracking-wider">Classes</p>
            <div className="space-y-2">
              {batches.map((batch) => {
                const club = clubMap.get(batch.club_id);
                return (
                  <div
                    key={batch.id}
                    className="p-4 bg-surface-raised border border-border rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-body font-medium text-heading">{batch.name}</p>
                        {club && (
                          <p className="text-caption text-muted">{club.name}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-caption text-muted">
                          {formatTime(batch.start_time)}
                          {batch.end_time ? ` – ${formatTime(batch.end_time)}` : ""}
                        </p>
                        {batch.days && (batch.days as DayOfWeek[]).length > 0 && (
                          <p className="text-caption text-muted">
                            {(batch.days as string[]).map((d) => DAY_LABELS[d] ?? d).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clubs */}
        <div className="space-y-3">
          <p className="text-label text-muted uppercase tracking-wider">Clubs</p>
          <div className="space-y-2">
            {(clubs ?? []).map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.slug}`}
                className="flex items-center justify-between p-4 bg-surface-raised border border-border rounded-xl hover:border-brand/40 transition-colors"
              >
                <p className="text-body font-medium text-heading">{club.name}</p>
                <span className="text-body text-brand font-medium">Train here →</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Ratings & Reviews */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label text-muted uppercase tracking-wider">
              Reviews{ratingCount > 0 ? ` (${ratingCount})` : ""}
            </p>
            <WriteRatingButton
              coachUserId={params.userId}
              clubs={(clubs ?? []).map((c) => ({ id: c.id, name: c.name }))}
              isSignedIn={!!user}
              existingRating={userRating}
            />
          </div>

          {recentRatings && recentRatings.length > 0 ? (
            <div className="space-y-3">
              {recentRatings.map((r) => (
                <div key={r.id} className="p-4 bg-surface-raised border border-border rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-medium text-heading">
                        {reviewerMap.get(r.reviewer_user_id) ?? "Member"}
                      </span>
                      <StarRating value={r.rating} size="sm" />
                    </div>
                    <span className="text-caption text-muted shrink-0">
                      {formatReviewDate(r.created_at)}
                    </span>
                  </div>
                  {r.review_text && (
                    <p className="text-body text-muted">{r.review_text}</p>
                  )}
                  {clubMap.get(r.club_id) && (
                    <p className="text-caption text-muted">
                      at {clubMap.get(r.club_id)?.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-surface-raised border border-border rounded-xl text-center">
              <p className="text-body text-muted">No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
