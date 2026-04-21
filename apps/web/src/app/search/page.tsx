"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Building2, User, Users, X } from "lucide-react";
import { cn } from "@zenzo/ui";
import { INTEREST_CATEGORIES } from "@zenzo/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchType = "clubs" | "coaches" | "members";

interface ClubResult {
  id: string;
  slug: string;
  name: string;
  business_type: string;
  city: string | null;
}

interface CoachResult {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  username: string | null;
  clubs: { name: string; slug: string }[];
  avg_rating: null;
}

interface MemberResult {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
  interests: string[];
  achievement_count: number;
}

type AnyResult = ClubResult | CoachResult | MemberResult;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, { label: string; color: string }> = {
  gym:          { label: "Gym",          color: "bg-blue-500/10 text-blue-500" },
  martial_arts: { label: "Martial Arts", color: "bg-red-500/10 text-red-500" },
  dance:        { label: "Dance",        color: "bg-pink-500/10 text-pink-500" },
  yoga:         { label: "Yoga",         color: "bg-emerald-500/10 text-emerald-500" },
  other:        { label: "Other",        color: "bg-purple-500/10 text-purple-500" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function interestLabel(slug: string): string {
  return INTEREST_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

function interestIcon(slug: string): string {
  return INTEREST_CATEGORIES.find((c) => c.slug === slug)?.icon ?? "🎯";
}

// ─── Result Cards ─────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: ClubResult }) {
  const cat = CATEGORY_DISPLAY[club.business_type] ?? { label: club.business_type, color: "bg-muted/10 text-muted" };
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex items-center gap-4 p-4 bg-surface-raised border border-border rounded-xl hover:border-brand/40 hover:bg-surface-subtle transition-all"
    >
      <div className="size-11 rounded-xl bg-primary-subtle flex items-center justify-center shrink-0">
        <Building2 className="size-5 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold text-heading truncate group-hover:text-brand transition-colors">
          {club.name}
        </p>
        {club.city && <p className="text-caption text-muted">{club.city}</p>}
      </div>
      <span className={cn("shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-label font-medium", cat.color)}>
        {cat.label}
      </span>
    </Link>
  );
}

function CoachCard({ coach }: { coach: CoachResult }) {
  const clubNames = coach.clubs.map((c) => c.name).join(", ");
  return (
    <Link
      href={`/coaches/${coach.user_id}`}
      className="group flex items-center gap-4 p-4 bg-surface-raised border border-border rounded-xl hover:border-brand/40 hover:bg-surface-subtle transition-all"
    >
      <div className="size-11 rounded-full bg-primary flex items-center justify-center text-body font-bold text-primary-foreground shrink-0">
        {initials(coach.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold text-heading truncate group-hover:text-brand transition-colors">
          {coach.full_name}
        </p>
        {clubNames && (
          <p className="text-caption text-muted truncate">{clubNames}</p>
        )}
        {coach.username && (
          <p className="text-label text-muted/60">@{coach.username}</p>
        )}
      </div>
      <span className="shrink-0 text-caption text-brand font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        View →
      </span>
    </Link>
  );
}

function MemberCard({ member }: { member: MemberResult }) {
  return (
    <Link
      href={member.username ? `/u/${member.username}` : "#"}
      className="group flex items-center gap-4 p-4 bg-surface-raised border border-border rounded-xl hover:border-brand/40 hover:bg-surface-subtle transition-all"
    >
      <div className="size-11 rounded-full bg-surface-elevated flex items-center justify-center text-body font-bold text-foreground shrink-0">
        {initials(member.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold text-heading truncate group-hover:text-brand transition-colors">
          {member.full_name}
        </p>
        {member.username && (
          <p className="text-caption text-muted">@{member.username}</p>
        )}
        {member.interests.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {member.interests.slice(0, 3).map((slug) => (
              <span key={slug} className="text-label text-muted/70">
                {interestIcon(slug)} {interestLabel(slug)}
              </span>
            ))}
          </div>
        )}
      </div>
      {member.achievement_count > 0 && (
        <span className="shrink-0 text-label text-muted">
          🏆 {member.achievement_count}
        </span>
      )}
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
          <div className="skeleton-shimmer size-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-4 w-40 rounded" />
            <div className="skeleton-shimmer h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ type, query }: { type: SearchType; query: string }) {
  const labels: Record<SearchType, string> = {
    clubs: "clubs",
    coaches: "coaches",
    members: "members",
  };
  return (
    <div className="text-center py-16 space-y-2">
      <p className="text-h3 text-heading">No {labels[type]} found</p>
      <p className="text-body text-muted">No results for &ldquo;{query}&rdquo;</p>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS: { key: SearchType; label: string; icon: typeof Search }[] = [
  { key: "clubs",   label: "Clubs",   icon: Building2 },
  { key: "coaches", label: "Coaches", icon: User },
  { key: "members", label: "Members", icon: Users },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialType = (searchParams.get("type") ?? "clubs") as SearchType;

  const [query, setQuery] = useState(initialQ);
  const [activeType, setActiveType] = useState<SearchType>(initialType);
  const [results, setResults] = useState<AnyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushUrl = useCallback(
    (q: string, type: SearchType) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("type", type);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const fetchResults = useCallback(async (q: string, type: SearchType) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&type=${type}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      } else if (res.status === 401) {
        setResults([]);
      }
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  // Debounce search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushUrl(query, activeType);
      fetchResults(query, activeType);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeType, pushUrl, fetchResults]);

  function handleTabChange(type: SearchType) {
    setActiveType(type);
    setResults([]);
    setSearched(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clubs, coaches, or members…"
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-raised border border-border text-body text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setSearched(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-body-sm font-medium transition-colors",
              activeType === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <ResultSkeleton />
      ) : !query.trim() ? (
        <div className="text-center py-16 space-y-2">
          <Search className="size-10 text-muted mx-auto" />
          <p className="text-body text-muted">
            Search for{" "}
            {activeType === "clubs"
              ? "gyms, studios, and dojos"
              : activeType === "coaches"
              ? "coaches and instructors"
              : "members on Zenzo"}
          </p>
        </div>
      ) : searched && results.length === 0 ? (
        <EmptyState type={activeType} query={query} />
      ) : (
        <div className="space-y-3">
          {activeType === "clubs" &&
            (results as ClubResult[]).map((r) => (
              <ClubCard key={r.id} club={r} />
            ))}
          {activeType === "coaches" &&
            (results as CoachResult[]).map((r) => (
              <CoachCard key={r.user_id} coach={r} />
            ))}
          {activeType === "members" &&
            (results as MemberResult[]).map((r) => (
              <MemberCard key={r.id} member={r} />
            ))}
        </div>
      )}

      {/* URL hint */}
      {activeType === "members" && !query && (
        <p className="text-caption text-muted text-center">
          Member search is only available when signed in.
        </p>
      )}
    </div>
  );
}
