// /clubs/[slug] — public club listing page
// No auth required. Returns 404 if club is not verified.

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Users, Clock, MessageCircle } from "lucide-react";
import { createServiceClient } from "@zenzo/database/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerificationStatus, ClubCategory, BillingCycle, StaffRole } from "@zenzo/database/enums";
import { StarRating } from "@zenzo/ui";
import { formatCurrency } from "@zenzo/utils";
import type { DayOfWeek } from "@zenzo/database";
import { WriteReviewButton } from "./_components/write-review-button";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  [ClubCategory.Gym]:         "Gym",
  [ClubCategory.MartialArts]: "Martial Arts",
  [ClubCategory.Dance]:       "Dance",
  [ClubCategory.Yoga]:        "Yoga",
  [ClubCategory.Other]:       "Other",
};

const BILLING_LABELS: Record<string, string> = {
  [BillingCycle.Monthly]:    "/ month",
  [BillingCycle.Quarterly]:  "/ quarter",
  [BillingCycle.HalfYearly]: "/ 6 months",
  [BillingCycle.Annual]:     "/ year",
  [BillingCycle.PerSession]: "/ session",
};

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed",
  thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

function formatDays(days: string[]): string {
  return days.map((d) => DAY_LABELS[d] ?? d).join(", ");
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  if (!h || !m) return time;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 text-heading">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicClubPage({
  params,
}: {
  params: { slug: string };
}) {
  const service = createServiceClient();

  // Club
  const { data: club } = await service
    .from("clubs")
    .select("id, name, slug, city, phone, business_type, description, verification_status, avg_rating")
    .eq("slug", params.slug)
    .single();

  if (!club || club.verification_status !== VerificationStatus.Verified) {
    notFound();
  }

  // Fee plans, batches, staff — in parallel
  const [
    { data: plans },
    { data: batches },
    { data: staff },
    { data: reviews },
  ] = await Promise.all([
    service
      .from("fee_plans")
      .select("id, name, amount_paise, billing_cycle")
      .eq("club_id", club.id)
      .order("amount_paise", { ascending: true }),
    service
      .from("batches")
      .select("id, name, start_time, end_time, days")
      .eq("club_id", club.id)
      .order("name", { ascending: true }),
    service
      .from("club_staff")
      .select("id, role, user_id")
      .eq("club_id", club.id),
    service
      .from("club_reviews")
      .select("id, rating, review_text, created_at, reviewer_user_id")
      .eq("club_id", club.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Staff names
  const staffUserIds = (staff ?? []).map((s) => s.user_id);
  let staffUsers: { id: string; full_name: string }[] = [];
  if (staffUserIds.length > 0) {
    const { data } = await service
      .from("users")
      .select("id, full_name")
      .in("id", staffUserIds);
    staffUsers = data ?? [];
  }

  const coaches = (staff ?? [])
    .filter((s) => s.role === StaffRole.Coach)
    .map((s) => ({
      id:        s.id,
      full_name: staffUsers.find((u) => u.id === s.user_id)?.full_name ?? "Coach",
    }));

  // Reviewer names
  const reviewerIds = (reviews ?? []).map((r) => r.reviewer_user_id);
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

  let userReview: { id: string; rating: number; review_text: string | null } | null = null;
  if (user) {
    const { data } = await service
      .from("club_reviews")
      .select("id, rating, review_text")
      .eq("club_id", club.id)
      .eq("reviewer_user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    userReview = data ?? null;
  }

  const avgRating = club.avg_rating ? Number(club.avg_rating) : null;
  const reviewCount = reviews?.length ?? 0;

  return (
    <div className="bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-h1 text-heading">{club.name}</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-primary-subtle text-brand">
              {CATEGORY_LABELS[club.business_type] ?? club.business_type}
            </span>
          </div>
          {club.city && (
            <div className="flex items-center gap-1.5 text-body text-muted">
              <MapPin className="size-4" />
              {club.city}
            </div>
          )}
          {avgRating && (
            <div className="flex items-center gap-2">
              <StarRating value={avgRating} size="sm" />
              <span className="text-caption text-muted font-medium">
                {avgRating.toFixed(1)} / 5
              </span>
            </div>
          )}
        </div>

        {/* About */}
        {club.description && (
          <SectionCard title="About">
            <p className="text-body text-muted whitespace-pre-line">{club.description}</p>
          </SectionCard>
        )}

        {/* Plans & Pricing */}
        {plans && plans.length > 0 && (
          <SectionCard title="Plans & Pricing">
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-body text-heading">{plan.name}</span>
                  <span className="text-body font-semibold text-heading">
                    {formatCurrency(plan.amount_paise)}
                    <span className="text-caption text-muted font-normal ml-1">
                      {BILLING_LABELS[plan.billing_cycle] ?? ""}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Schedule */}
        {batches && batches.length > 0 && (
          <SectionCard title="Schedule">
            <div className="space-y-2">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <Clock className="size-4 text-muted mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-body font-medium text-heading">{batch.name}</p>
                    <p className="text-caption text-muted">
                      {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
                      {batch.days && (batch.days as DayOfWeek[]).length > 0 && (
                        <> · {formatDays(batch.days as string[])}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Coaches */}
        {coaches.length > 0 && (
          <SectionCard title="Coaches">
            <div className="flex flex-wrap gap-2">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-subtle border border-border"
                >
                  <div className="size-7 rounded-full bg-primary-subtle flex items-center justify-center">
                    <Users className="size-3.5 text-brand" />
                  </div>
                  <span className="text-body font-medium text-heading">{coach.full_name}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Reviews */}
        <SectionCard
          title={`Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}`}
          action={
            <WriteReviewButton
              clubSlug={club.slug}
              isSignedIn={!!user}
              existingReview={
                userReview
                  ? { id: userReview.id, rating: userReview.rating, reviewText: userReview.review_text }
                  : null
              }
            />
          }
        >
          {avgRating && (
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <StarRating value={avgRating} />
              <span className="text-body font-semibold text-heading">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-caption text-muted">/ 5</span>
            </div>
          )}

          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-medium text-heading">
                        {reviewerMap.get(review.reviewer_user_id) ?? "Member"}
                      </span>
                      <StarRating value={review.rating} size="sm" />
                    </div>
                    <span className="text-caption text-muted shrink-0">
                      {formatReviewDate(review.created_at)}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-body text-muted">{review.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-muted">No reviews yet. Be the first!</p>
          )}
        </SectionCard>

        {/* CTA */}
        <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-h3 text-heading">Want to join?</h2>
          <p className="text-body text-muted">
            Membership is by invite from the club. Contact the club on WhatsApp to express interest.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {club.phone && (
              <a
                href={`https://wa.me/91${club.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#25D366] text-white font-medium text-body hover:bg-[#1fba5a] transition-colors"
              >
                <MessageCircle className="size-4" />
                WhatsApp the Club
              </a>
            )}
            <Link
              href="/portal/invites"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-subtle border border-border font-medium text-body text-heading hover:bg-surface-raised transition-colors"
            >
              Check My Invites
            </Link>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-body hover:bg-primary/90 transition-colors"
            >
              Sign up to Zenzo
            </Link>
          </div>
          {club.phone && (
            <div className="flex items-center gap-1.5 text-caption text-muted">
              <Phone className="size-3" />
              {club.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
