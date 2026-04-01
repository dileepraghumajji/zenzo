"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, X, ChevronRight } from "lucide-react";
import { ClubCategory } from "@zenzo/database/enums";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Club {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  business_type: string;
  description: string | null;
}

interface ApiResponse {
  clubs: Club[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "",                        label: "All"          },
  { value: ClubCategory.Gym,          label: "Gym"          },
  { value: ClubCategory.MartialArts,  label: "Martial Arts" },
  { value: ClubCategory.Dance,        label: "Dance"        },
  { value: ClubCategory.Yoga,         label: "Yoga"         },
  { value: ClubCategory.Other,        label: "Other"        },
] as const;

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  [ClubCategory.Gym]:         { emoji: "🏋️", label: "Gym"         },
  [ClubCategory.MartialArts]: { emoji: "🥋", label: "Martial Arts" },
  [ClubCategory.Dance]:       { emoji: "💃", label: "Dance"        },
  [ClubCategory.Yoga]:        { emoji: "🧘", label: "Yoga"         },
  [ClubCategory.Other]:       { emoji: "⭐", label: "Other"        },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ClubCardSkeleton() {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="skeleton-shimmer w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="skeleton-shimmer h-5 w-3/5 rounded" />
          <div className="flex gap-2">
            <div className="skeleton-shimmer h-4 w-16 rounded-md" />
            <div className="skeleton-shimmer h-4 w-20 rounded" />
          </div>
          <div className="skeleton-shimmer h-3 w-full rounded" />
          <div className="skeleton-shimmer h-3 w-4/5 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Club card ───────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: Club }) {
  const meta = CATEGORY_META[club.business_type] ?? { emoji: "⭐", label: club.business_type };

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex items-start gap-4 bg-surface-raised border border-border rounded-xl p-5 hover:border-brand/50 hover:shadow-md transition-all duration-200"
    >
      {/* Category emoji tile */}
      <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-subtle flex items-center justify-center text-2xl select-none">
        {meta.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-h3 text-heading leading-snug group-hover:text-brand transition-colors">
            {club.name}
          </h3>
          <ChevronRight className="size-4 text-muted shrink-0 group-hover:text-brand group-hover:translate-x-0.5 transition-all mt-0.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-caption font-medium bg-primary-subtle text-brand">
            {meta.label}
          </span>
          {club.city && (
            <span className="inline-flex items-center gap-1 text-caption text-muted">
              <MapPin className="size-3 shrink-0" />
              {club.city}
            </span>
          )}
        </div>

        {club.description && (
          <p className="text-caption text-muted line-clamp-2 leading-relaxed">
            {club.description}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExploreClient() {
  // ── UI state ────────────────────────────────────────────────────────────────
  const [clubs,          setClubs]          = useState<Club[]>([]);
  const [total,          setTotal]          = useState(0);
  const [hasMore,        setHasMore]        = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);

  // ── Controlled filter inputs ────────────────────────────────────────────────
  const [q,        setQ]        = useState("");
  const [category, setCategory] = useState("");
  const [city,     setCity]     = useState("");

  // ── Refs: avoid stale closures in IntersectionObserver ───────────────────
  const pageRef       = useRef(0);
  const hasMoreRef    = useRef(true);
  const isLoadingRef  = useRef(false);
  const filtersRef    = useRef({ q: "", category: "", city: "" });
  const requestIdRef  = useRef(0);
  const sentinelRef   = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Core fetch ──────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (replace: boolean) => {
    // Load-more: skip if in progress or nothing left
    if (!replace && (isLoadingRef.current || !hasMoreRef.current)) return;

    isLoadingRef.current = true;
    const reqId    = ++requestIdRef.current;
    const nextPage = replace ? 1 : pageRef.current + 1;

    if (replace) setInitialLoading(true);
    else         setLoadingMore(true);

    const params = new URLSearchParams({ page: String(nextPage) });
    const f = filtersRef.current;
    if (f.q)        params.set("q",        f.q);
    if (f.category) params.set("category", f.category);
    if (f.city)     params.set("city",     f.city);

    try {
      const res  = await fetch(`/api/clubs/explore?${params.toString()}`);
      if (!res.ok) return;
      const data: ApiResponse = await res.json();

      // Discard stale responses (happens when filters change mid-flight)
      if (reqId !== requestIdRef.current) return;

      const clubs = data.clubs ?? [];
      const more  = nextPage * (data.pageSize ?? 20) < (data.total ?? 0);
      pageRef.current    = nextPage;
      hasMoreRef.current = more;

      setClubs((prev) => replace ? clubs : [...prev, ...clubs]);
      setTotal(data.total ?? 0);
      setHasMore(more);
    } catch {
      // Network errors: silently fail, user can scroll to retry
    } finally {
      if (reqId === requestIdRef.current) {
        isLoadingRef.current = false;
        setInitialLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    void fetchPage(true);
  }, [fetchPage]);

  // ── IntersectionObserver: trigger load-more as user nears bottom ───────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          void fetchPage(false);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchPage]);

  // ── Reset + re-fetch (called after filter changes) ─────────────────────────
  const resetAndFetch = useCallback(() => {
    hasMoreRef.current = true;
    pageRef.current    = 0;
    setHasMore(true);
    void fetchPage(true);
  }, [fetchPage]);

  // ── Filter handlers ─────────────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setQ(value);
    filtersRef.current = { ...filtersRef.current, q: value };
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(resetAndFetch, 350);
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    filtersRef.current = { ...filtersRef.current, city: value };
    if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
    cityTimerRef.current = setTimeout(resetAndFetch, 350);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    filtersRef.current = { ...filtersRef.current, category: value };
    resetAndFetch();
  };

  const clearSearch = () => handleSearchChange("");
  const clearCity   = () => handleCityChange("");

  const activeFilters = q || category || city;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Sticky filter bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 -mx-4 px-4 pt-4 pb-3 bg-background border-b border-border space-y-3">

        {/* Search + city row */}
        <div className="flex gap-2">

          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={q}
              placeholder="Search clubs by name…"
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-border bg-surface-raised text-body text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
            />
            {q && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* City input */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={city}
              placeholder="City"
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-28 pl-9 pr-7 py-2.5 rounded-lg border border-border bg-surface-raised text-body text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
            />
            {city && (
              <button
                onClick={clearCity}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition"
                aria-label="Clear city"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category chips — horizontally scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            const emoji  = cat.value ? CATEGORY_META[cat.value]?.emoji : null;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium border transition-all
                  ${active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface-raised border-border text-muted hover:border-brand/40 hover:text-heading"
                  }`}
              >
                {emoji && <span className="text-xs leading-none">{emoji}</span>}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Result count ──────────────────────────────────────────────────── */}
      {!initialLoading && (
        <p className="text-caption text-muted px-0.5">
          {total === 0
            ? "No clubs found"
            : `${total} club${total !== 1 ? "s" : ""}${activeFilters ? " matching your filters" : ""}`
          }
        </p>
      )}

      {/* ── Club list ─────────────────────────────────────────────────────── */}
      {initialLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <ClubCardSkeleton key={i} />)}
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-5xl">🔍</div>
          <p className="text-h3 text-heading">No clubs found</p>
          <p className="text-body text-muted max-w-xs mx-auto">
            Try different filters — more clubs join Zenzo every week.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => <ClubCard key={club.id} club={club} />)}
        </div>
      )}

      {/* ── Loading more skeletons ────────────────────────────────────────── */}
      {loadingMore && (
        <div className="space-y-3">
          <ClubCardSkeleton />
          <ClubCardSkeleton />
        </div>
      )}

      {/* ── End of results ────────────────────────────────────────────────── */}
      {!hasMore && !initialLoading && clubs.length > 0 && (
        <p className="text-center text-caption text-muted py-8">
          You&apos;ve seen all {total} club{total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Sentinel: IntersectionObserver watches this to trigger load-more */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </div>
  );
}
