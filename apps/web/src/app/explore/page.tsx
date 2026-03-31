// /explore — public club discovery page
// No auth required. Reads search params for q, category, city.

import { Suspense } from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerificationStatus, ClubCategory } from "@zenzo/database/enums";
import { SearchBar, CategoryChips } from "./_components/explore-client";

// ─── Category display labels ─────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  [ClubCategory.Gym]:         "Gym",
  [ClubCategory.MartialArts]: "Martial Arts",
  [ClubCategory.Dance]:       "Dance",
  [ClubCategory.Yoga]:        "Yoga",
  [ClubCategory.Other]:       "Other",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Club {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  business_type: string;
  description: string | null;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ClubCardSkeleton() {
  return (
    <div className="skeleton-shimmer rounded-xl h-32 w-full" />
  );
}

function ExploreSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => <ClubCardSkeleton key={i} />)}
    </div>
  );
}

// ─── Club card ───────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: Club }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="block bg-surface-raised border border-border rounded-xl px-5 py-4 hover:border-brand/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body font-semibold text-heading truncate">{club.name}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-primary-subtle text-brand">
              {CATEGORY_LABELS[club.business_type] ?? club.business_type}
            </span>
          </div>
          {club.city && (
            <div className="flex items-center gap-1 text-caption text-muted">
              <MapPin className="size-3" />
              {club.city}
            </div>
          )}
          {club.description && (
            <p className="text-caption text-muted line-clamp-2">{club.description}</p>
          )}
        </div>
        <ChevronRight className="size-4 text-muted shrink-0 group-hover:text-brand transition-colors mt-1" />
      </div>
    </Link>
  );
}

// ─── Results loader (async SC) ───────────────────────────────────────────────

async function ClubResults({
  q,
  category,
  city,
}: {
  q: string;
  category: string;
  city: string;
}) {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("clubs")
    .select("id, name, slug, city, business_type, description")
    .eq("verification_status", VerificationStatus.Verified)
    .eq("listed", true)
    .order("name", { ascending: true })
    .limit(40);

  if (q)        query = query.ilike("name", `%${q}%`);
  if (category) query = query.eq("business_type", category);
  if (city)     query = query.ilike("city", `%${city}%`);

  const { data: clubs } = await query;

  if (!clubs || clubs.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-body font-semibold text-heading">No clubs found</p>
        <p className="text-caption text-muted max-w-xs mx-auto">
          No clubs found in this area yet. Know a gym? Tell them about Zenzo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-caption text-muted">{clubs.length} club{clubs.length !== 1 ? "s" : ""} found</p>
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface ExplorePageProps {
  searchParams: {
    q?: string;
    category?: string;
    city?: string;
  };
}

export default function ExplorePage({ searchParams }: ExplorePageProps) {
  const q        = searchParams.q        ?? "";
  const category = searchParams.category ?? "";
  const city     = searchParams.city     ?? "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface-raised">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-1">
          <h1 className="text-h1 text-heading">Explore Clubs</h1>
          <p className="text-body text-muted">Find the perfect club near you</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Search + filters — client islands */}
        <Suspense fallback={null}>
          <SearchBar defaultValue={q} />
          <CategoryChips selected={category} />
        </Suspense>

        {/* Results — async SC */}
        <Suspense fallback={<ExploreSkeleton />}>
          <ClubResults q={q} category={category} city={city} />
        </Suspense>
      </div>
    </div>
  );
}
