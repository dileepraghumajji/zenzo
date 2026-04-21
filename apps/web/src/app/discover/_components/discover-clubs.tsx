import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, Building2 } from "lucide-react";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ClubCategory, InterestSlug, VerificationStatus } from "@zenzo/database";
import type { Database } from "@zenzo/database";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

const PAGE_SIZE = 20;

const INTEREST_TO_CATEGORIES: Partial<Record<InterestSlug, ClubCategory[]>> = {
  [InterestSlug.MartialArts]: [ClubCategory.MartialArts],
  [InterestSlug.Boxing]:      [ClubCategory.MartialArts],
  [InterestSlug.Fitness]:     [ClubCategory.Gym],
  [InterestSlug.Crossfit]:    [ClubCategory.Gym],
  [InterestSlug.Dance]:       [ClubCategory.Dance],
  [InterestSlug.Yoga]:        [ClubCategory.Yoga],
  [InterestSlug.Other]:       [ClubCategory.Other],
};

const CATEGORY_DISPLAY: Record<ClubCategory, { label: string; color: string }> = {
  [ClubCategory.Gym]:         { label: "Gym",          color: "bg-blue-500/10 text-blue-500" },
  [ClubCategory.MartialArts]: { label: "Martial Arts", color: "bg-red-500/10 text-red-500" },
  [ClubCategory.Dance]:       { label: "Dance",        color: "bg-pink-500/10 text-pink-500" },
  [ClubCategory.Yoga]:        { label: "Yoga",         color: "bg-emerald-500/10 text-emerald-500" },
  [ClubCategory.Other]:       { label: "Other",        color: "bg-purple-500/10 text-purple-500" },
};

// ─── Invite Banner ────────────────────────────────────────────────────────────

function InviteBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Link
      href="/portal/invites"
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition-colors"
    >
      <span className="text-body-sm font-medium text-amber-600 dark:text-amber-400">
        You have {count} pending {count === 1 ? "invite" : "invites"} →
      </span>
    </Link>
  );
}

// ─── Club Card ────────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: Pick<ClubRow, "slug" | "name" | "business_type" | "city" | "logo_url" | "description"> }) {
  const category = CATEGORY_DISPLAY[club.business_type as ClubCategory] ?? { label: club.business_type, color: "bg-muted/10 text-muted" };

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl hover:border-brand/40 hover:bg-surface-subtle transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="size-11 rounded-xl bg-primary-subtle flex items-center justify-center shrink-0">
          <Building2 className="size-5 text-brand" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-heading truncate group-hover:text-brand transition-colors">
            {club.name}
          </p>
          {club.city && (
            <p className="text-caption text-muted truncate">{club.city}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-label font-medium ${category.color}`}>
          {category.label}
        </span>
        <span className="text-caption text-brand font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View →
        </span>
      </div>
    </Link>
  );
}

// ─── Club Grid Skeleton ───────────────────────────────────────────────────────

export function DiscoverSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="skeleton-shimmer h-12 w-full rounded-xl" />
      <div className="skeleton-shimmer h-6 w-48 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Main async server component ─────────────────────────────────────────────

export async function DiscoverClubs() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load user interests + profile in parallel
  const [interestsRes, profileRes] = await Promise.all([
    supabase.from("user_interests").select("slug").eq("user_id", user.id),
    supabase.from("users").select("city, email, phone").eq("id", user.id).single(),
  ]);

  const userSlugs = (interestsRes.data ?? []).map((i) => i.slug as InterestSlug);
  const userCity = profileRes.data?.city ?? null;
  const userEmail = profileRes.data?.email ?? user.email ?? null;
  const userPhone = profileRes.data?.phone ?? null;

  const matchedCategories = [
    ...new Set(userSlugs.flatMap((slug) => INTEREST_TO_CATEGORIES[slug] ?? [])),
  ] as ClubCategory[];

  // Query clubs filtered by interests + city
  let clubsQuery = supabase
    .from("clubs")
    .select("id, slug, name, business_type, city, logo_url, description")
    .eq("listed", true)
    .eq("verification_status", VerificationStatus.Verified);

  if (matchedCategories.length > 0) {
    clubsQuery = clubsQuery.in("business_type", matchedCategories);
  }
  if (userCity) {
    clubsQuery = clubsQuery.ilike("city", userCity);
  }

  const { data: clubs } = await clubsQuery
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  // Count pending invites (admin client bypasses RLS on email/phone-keyed rows)
  let inviteCount = 0;
  const admin = createSupabaseAdminClient();
  const inviteConditions: string[] = [];
  if (userEmail) inviteConditions.push(`email.eq.${userEmail}`);
  if (userPhone) inviteConditions.push(`phone.eq.${userPhone}`);

  if (inviteConditions.length > 0) {
    const now = new Date().toISOString();
    const { count } = await admin
      .from("club_invites")
      .select("id", { count: "exact", head: true })
      .or(inviteConditions.join(","))
      .eq("status", "pending")
      .gt("expires_at", now);
    inviteCount = count ?? 0;
  }

  const clubList = clubs ?? [];
  const hasMore = clubList.length === PAGE_SIZE;

  const headingCity = userCity ? `in ${userCity}` : "";
  const hasInterests = userSlugs.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Invite banner */}
      <InviteBanner count={inviteCount} />

      {/* Heading */}
      <div>
        <h1 className="text-h1 font-bold text-heading">
          {hasInterests
            ? `For you${headingCity ? ` ${headingCity}` : ""}`
            : "Clubs matching your interests"}
        </h1>
        {!hasInterests && (
          <p className="text-body text-muted mt-1">
            <Link href="/onboarding/interests" className="text-brand hover:underline">
              Set your interests
            </Link>{" "}
            to get personalised recommendations.
          </p>
        )}
      </div>

      {/* Club grid or empty state */}
      {clubList.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="size-16 rounded-full bg-surface-raised flex items-center justify-center mx-auto">
            <Compass className="size-7 text-muted" />
          </div>
          <div className="space-y-1">
            <h2 className="text-h3 text-heading">No clubs found{userCity ? ` in ${userCity}` : ""}</h2>
            <p className="text-body text-muted">
              No clubs match your interests{userCity ? ` in ${userCity}` : ""} yet.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-brand font-medium text-body hover:underline"
          >
            <Compass className="size-4" />
            Explore all clubs →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {clubList.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>

          {hasMore && (
            <p className="text-caption text-muted text-center">
              Showing first {PAGE_SIZE} clubs.{" "}
              <Link href="/explore" className="text-brand hover:underline">
                Explore all →
              </Link>
            </p>
          )}

          <div className="pt-2 text-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-body font-medium text-muted hover:text-brand transition-colors"
            >
              <Compass className="size-4" />
              Explore all clubs →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
