"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@zenzo/ui";
import { SearchBar }         from "@/components/search/search-bar";
import { QuickFilterChips }  from "@/components/search/quick-filter-chips";
import { NearMeButton }      from "@/components/search/near-me-button";
import { ActiveFilterChips } from "@/components/search/active-filter-chips";
import { AdvancedFilters }   from "@/components/search/advanced-filters";
import { ResultCount }       from "@/components/search/result-count";
import { FeaturedCarousel }  from "@/components/search/featured-carousel";
import { ClubCard, ClubCardSkeleton }   from "@/components/search/club-card";
import { CoachCard, CoachCardSkeleton } from "@/components/search/coach-card";
import { NoResults, ErrorState }        from "@/components/search/empty-error-states";
import type { ClubSearchResult, CoachSearchResult, FilterState } from "@/components/search/types";
import { EMPTY_FILTERS } from "@/components/search/types";
import type { SearchMapProps } from "@/components/search/search-map";

// ─── Dynamic map import (SSR disabled — Leaflet is browser-only) ──────────────

const SearchMap = dynamic<SearchMapProps>(
  () => import("@/components/search/search-map").then((m) => ({ default: m.SearchMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-xl bg-muted border border-border animate-pulse" style={{ minHeight: "400px" }} />
    ),
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type GeoState  = { lat: number; lng: number; radius: number };
type ViewMode  = "list" | "map";

interface ClubsApiResponse {
  clubs:      ClubSearchResult[];
  total:      number;
  nextCursor: string | null;
  hasMore:    boolean;
}

interface CoachesApiResponse {
  coaches:    CoachSearchResult[];
  total:      number;
  nextCursor: string | null;
  hasMore:    boolean;
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

function paramsToFilters(params: URLSearchParams): FilterState {
  return {
    category:        params.get("category") ?? "",
    subcategories:   params.get("subcategories")?.split(",").filter(Boolean) ?? [],
    amenities:       params.get("amenities")?.split(",").filter(Boolean) ?? [],
    specializations: params.get("specializations")?.split(",").filter(Boolean) ?? [],
    price_range:     params.get("price_range") ?? "",
    min_rating:      parseFloat(params.get("min_rating") ?? "0") || 0,
    availability:    params.get("availability") ?? "",
    sort:            params.get("sort") ?? "relevance",
  };
}

function stateToParams(q: string, f: FilterState, geo: GeoState | null): URLSearchParams {
  const p = new URLSearchParams();
  if (q)                              p.set("q",               q);
  if (f.category)                     p.set("category",        f.category);
  if (f.subcategories.length)         p.set("subcategories",   f.subcategories.join(","));
  if (f.amenities.length)             p.set("amenities",       f.amenities.join(","));
  if (f.specializations.length)       p.set("specializations", f.specializations.join(","));
  if (f.price_range)                  p.set("price_range",     f.price_range);
  if (f.min_rating > 0)               p.set("min_rating",      String(f.min_rating));
  if (f.availability)                 p.set("availability",    f.availability);
  if (f.sort && f.sort !== "relevance") p.set("sort",          f.sort);
  if (geo) {
    p.set("lat",    String(geo.lat));
    p.set("lng",    String(geo.lng));
    p.set("radius", String(geo.radius));
  }
  return p;
}

function buildClubApiParams(q: string, f: FilterState, geo: GeoState | null, cursor: string | null): URLSearchParams {
  const p = new URLSearchParams();
  if (q)                          p.set("q",             q);
  if (f.category && f.category !== "coaches") p.set("category", f.category);
  if (f.subcategories.length)     p.set("subcategories", f.subcategories.join(","));
  if (f.amenities.length)         p.set("amenities",     f.amenities.join(","));
  if (f.price_range)              p.set("price_range",   f.price_range);
  if (f.min_rating > 0)           p.set("min_rating",    String(f.min_rating));
  if (f.sort)                     p.set("sort",          f.sort);
  if (geo) {
    p.set("lat",       String(geo.lat));
    p.set("lng",       String(geo.lng));
    p.set("radius_km", String(geo.radius));
  }
  if (cursor) p.set("cursor", cursor);
  return p;
}

function buildCoachApiParams(q: string, f: FilterState, geo: GeoState | null, cursor: string | null): URLSearchParams {
  const p = new URLSearchParams();
  if (q)                          p.set("q",               q);
  if (f.specializations.length)   p.set("specializations", f.specializations.join(","));
  if (f.availability)             p.set("availability",    f.availability);
  if (f.min_rating > 0)           p.set("min_rating",      String(f.min_rating));
  if (f.sort)                     p.set("sort",            f.sort);
  if (geo) {
    p.set("lat",       String(geo.lat));
    p.set("lng",       String(geo.lng));
    p.set("radius_km", String(geo.radius));
  }
  if (cursor) p.set("cursor", cursor);
  return p;
}

// ─── ExploreClient ────────────────────────────────────────────────────────────

export default function ExploreClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── State (initialised from URL) ──────────────────────────────────────────
  const [query,   setQuery]   = useState(() => searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<FilterState>(() => paramsToFilters(searchParams));
  const [geo,     setGeo]     = useState<GeoState | null>(() => {
    const lat    = parseFloat(searchParams.get("lat")    ?? "");
    const lng    = parseFloat(searchParams.get("lng")    ?? "");
    const radius = parseFloat(searchParams.get("radius") ?? "5");
    return !isNaN(lat) && !isNaN(lng) ? { lat, lng, radius } : null;
  });
  const [view, setView] = useState<ViewMode>(() =>
    searchParams.get("view") === "map" ? "map" : "list"
  );

  // ── Results ───────────────────────────────────────────────────────────────
  const [clubs,   setClubs]   = useState<ClubSearchResult[]>([]);
  const [coaches, setCoaches] = useState<CoachSearchResult[]>([]);
  const [total,   setTotal]   = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [searching,      setSearching]      = useState(false);
  const [hasError,       setHasError]       = useState(false);

  // ── Refs for stable closures ──────────────────────────────────────────────
  const queryRef      = useRef(query);
  const filtersRef    = useRef(filters);
  const geoRef        = useRef(geo);
  const viewRef       = useRef<ViewMode>(view);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef    = useRef(true);
  const isLoadingRef  = useRef(false);
  const requestIdRef  = useRef(0);
  const sentinelRef   = useRef<HTMLDivElement>(null);
  const queryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { queryRef.current   = query;   }, [query]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { geoRef.current     = geo;     }, [geo]);
  useEffect(() => { viewRef.current    = view;    }, [view]);

  const isCoachMode = filters.category === "coaches";
  const showMap     = view === "map" && !isCoachMode;

  // ── URL push ──────────────────────────────────────────────────────────────
  const pushUrl = useCallback((q: string, f: FilterState, g: GeoState | null) => {
    const p = stateToParams(q, f, g);
    if (viewRef.current === "map") p.set("view", "map");
    const qs = p.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  }, [router]);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (replace: boolean) => {
    if (!replace && (isLoadingRef.current || !hasMoreRef.current)) return;

    isLoadingRef.current = true;
    const reqId  = ++requestIdRef.current;
    const cursor = replace ? null : nextCursorRef.current;
    const q = queryRef.current;
    const f = filtersRef.current;
    const g = geoRef.current;

    if (replace) { setInitialLoading(true); setHasError(false); }
    else         { setLoadingMore(true); }

    try {
      if (f.category === "coaches") {
        const params = buildCoachApiParams(q, f, g, cursor);
        const res    = await fetch(`/api/search/coaches?${params.toString()}`);
        if (reqId !== requestIdRef.current) return;
        if (!res.ok) { setHasError(true); return; }
        const data = await res.json() as CoachesApiResponse;
        if (reqId !== requestIdRef.current) return;
        nextCursorRef.current = data.nextCursor;
        hasMoreRef.current    = data.hasMore;
        setCoaches((prev) => replace ? data.coaches : [...prev, ...data.coaches]);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        const params = buildClubApiParams(q, f, g, cursor);
        const res    = await fetch(`/api/search/clubs?${params.toString()}`);
        if (reqId !== requestIdRef.current) return;
        if (!res.ok) { setHasError(true); return; }
        const data = await res.json() as ClubsApiResponse;
        if (reqId !== requestIdRef.current) return;
        nextCursorRef.current = data.nextCursor;
        hasMoreRef.current    = data.hasMore;
        setClubs((prev) => replace ? data.clubs : [...prev, ...data.clubs]);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch {
      if (reqId === requestIdRef.current) setHasError(true);
    } finally {
      if (reqId === requestIdRef.current) {
        isLoadingRef.current = false;
        setInitialLoading(false);
        setLoadingMore(false);
        setSearching(false);
      }
    }
  }, []);

  // ── Reset + refetch ───────────────────────────────────────────────────────
  const resetAndFetch = useCallback(() => {
    nextCursorRef.current = null;
    hasMoreRef.current    = true;
    setHasMore(true);
    setClubs([]);
    setCoaches([]);
    void fetchPage(true);
  }, [fetchPage]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    void fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Infinite scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          void fetchPage(false);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchPage]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleQueryChange(q: string) {
    setQuery(q);
    queryRef.current = q;
    setSearching(true);
    if (queryTimerRef.current) clearTimeout(queryTimerRef.current);
    queryTimerRef.current = setTimeout(() => {
      pushUrl(q, filtersRef.current, geoRef.current);
      resetAndFetch();
    }, 350);
  }

  function handleCategoryChange(cat: string) {
    const modeSwitch = (filtersRef.current.category === "coaches") !== (cat === "coaches");
    const newFilters: FilterState = modeSwitch
      ? { ...EMPTY_FILTERS, category: cat, sort: filtersRef.current.sort }
      : { ...filtersRef.current, category: cat };
    setFilters(newFilters);
    filtersRef.current = newFilters;
    pushUrl(queryRef.current, newFilters, geoRef.current);
    resetAndFetch();
  }

  function handleFiltersApply(f: FilterState) {
    setFilters(f);
    filtersRef.current = f;
    pushUrl(queryRef.current, f, geoRef.current);
    resetAndFetch();
  }

  function handleFilterRemove(patch: Partial<FilterState>) {
    const newFilters = { ...filtersRef.current, ...patch };
    setFilters(newFilters);
    filtersRef.current = newFilters;
    pushUrl(queryRef.current, newFilters, geoRef.current);
    resetAndFetch();
  }

  function handleClearAll() {
    const f = { ...EMPTY_FILTERS };
    setFilters(f);
    filtersRef.current = f;
    pushUrl(queryRef.current, f, geoRef.current);
    resetAndFetch();
  }

  function handleGeoSuccess(lat: number, lng: number, radius: number) {
    const g = { lat, lng, radius };
    setGeo(g);
    geoRef.current = g;
    pushUrl(queryRef.current, filtersRef.current, g);
    resetAndFetch();
  }

  function handleGeoClear() {
    setGeo(null);
    geoRef.current = null;
    pushUrl(queryRef.current, filtersRef.current, null);
    resetAndFetch();
  }

  function handleViewChange(v: ViewMode) {
    setView(v);
    viewRef.current = v;
    const p = stateToParams(queryRef.current, filtersRef.current, geoRef.current);
    if (v === "map") p.set("view", "map");
    const qs = p.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const resultItems = isCoachMode ? coaches : clubs;
  const hasAnyFilter = !!(
    query ||
    filters.category ||
    filters.amenities.length ||
    filters.specializations.length ||
    filters.price_range ||
    filters.min_rating ||
    filters.availability ||
    (filters.sort && filters.sort !== "relevance")
  );

  // ── Shared grid content ───────────────────────────────────────────────────

  const gridContent = initialLoading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) =>
        isCoachMode ? <CoachCardSkeleton key={i} /> : <ClubCardSkeleton key={i} />
      )}
    </div>
  ) : hasError ? (
    <ErrorState onRetry={() => { setHasError(false); resetAndFetch(); }} />
  ) : resultItems.length === 0 ? (
    <NoResults
      query={query}
      category={filters.category || undefined}
      onClearFilters={hasAnyFilter ? handleClearAll : undefined}
    />
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {isCoachMode
        ? coaches.map((c, i) => (
            <div key={c.user_id} className="card-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
              <CoachCard coach={c} showDistance={!!geo} />
            </div>
          ))
        : clubs.map((c, i) => (
            <div key={c.id} className="card-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
              <ClubCard club={c} showDistance={!!geo} />
            </div>
          ))
      }
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pt-2">

      {/* ── Sticky filter bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 -mx-4 px-4 pt-4 pb-3 bg-background border-b border-border space-y-3">
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSearch={handleQueryChange}
          loading={searching}
          placeholder="Search gyms, coaches, yoga studios..."
        />

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
            <QuickFilterChips active={filters.category} onChange={handleCategoryChange} />
          </div>
          <AdvancedFilters
            filters={filters}
            onApply={handleFiltersApply}
            mode={isCoachMode ? "coaches" : "clubs"}
          />
        </div>

        <NearMeButton
          active={!!geo}
          onGeoSuccess={handleGeoSuccess}
          onGeoClear={handleGeoClear}
        />
      </div>

      {/* ── Active filter chips ───────────────────────────────────────────── */}
      <ActiveFilterChips
        filters={filters}
        onRemove={handleFilterRemove}
        onClearAll={handleClearAll}
      />

      {/* ── Result count + view mode toggle ──────────────────────────────── */}
      {!initialLoading && (
        <div className="flex items-center justify-between gap-2">
          <ResultCount
            total={total}
            category={isCoachMode ? undefined : filters.category}
            loading={false}
          />

          {/* Map/List toggle — clubs only (coaches have no geo data) */}
          {!isCoachMode && (
            <div
              role="group"
              aria-label="View mode"
              className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 flex-shrink-0"
            >
              <button
                onClick={() => handleViewChange("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  view === "list"
                    ? "bg-surface-subtle text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => handleViewChange("map")}
                aria-label="Map view"
                aria-pressed={view === "map"}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  view === "map"
                    ? "bg-surface-subtle text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MapIcon className="size-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Featured carousel (list view, no active filters) ──────────────── */}
      {!showMap && !hasAnyFilter && !initialLoading && !isCoachMode && (
        <FeaturedCarousel />
      )}

      {/* ── Results area ─────────────────────────────────────────────────── */}
      {showMap ? (
        // Map view: split layout on desktop, full map on mobile
        <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-4 lg:items-start">

          {/* Left: scrollable list (desktop only) */}
          <div className="hidden lg:block space-y-4">
            {gridContent}

            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="size-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              </div>
            )}

            {!hasMore && !initialLoading && resultItems.length > 0 && (
              <p className="text-center text-caption text-muted py-8">
                All {total} result{total !== 1 ? "s" : ""} shown
              </p>
            )}
          </div>

          {/* Right: sticky Leaflet map */}
          <div className="lg:sticky lg:top-36 card-fade-in">
            <SearchMap
              clubs={clubs}
              geo={geo ?? undefined}
              className={cn(
                "w-full rounded-xl overflow-hidden border border-border",
                "h-[calc(100dvh-200px)] lg:h-[calc(100dvh-148px)]"
              )}
            />
          </div>
        </div>
      ) : (
        // List view: standard grid
        <>
          {gridContent}

          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="size-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
            </div>
          )}

          {!hasMore && !initialLoading && resultItems.length > 0 && (
            <p className="text-center text-caption text-muted py-8">
              All {total} result{total !== 1 ? "s" : ""} shown
            </p>
          )}
        </>
      )}

      {/* Sentinel for IntersectionObserver (always present) */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </div>
  );
}
