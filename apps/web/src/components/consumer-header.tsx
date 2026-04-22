"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, X, Building2 } from "lucide-react";
import { cn } from "@zenzo/ui";
import { AvatarDropdown } from "./avatar-dropdown";

interface UserData {
  initials: string;
  avatarUrl: string | null;
  fullName: string | null;
  hasClub: boolean;
  clubSlug: string | null;
}

interface ClubResult {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  business_type: string;
}

interface ConsumerHeaderProps {
  homeHref: string;
  user: UserData | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  gym: "Gym",
  martial_arts: "Martial Arts",
  dance: "Dance",
  yoga: "Yoga",
  other: "Other",
};

export function ConsumerHeader({ homeHref, user }: ConsumerHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClubResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isSearchOpen) {
      // slight delay so the animation completes before focusing
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
      setSearched(false);
    }
  }, [isSearchOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=clubs`);
      if (res.ok) {
        const data = await res.json();
        setResults((data.results ?? []).slice(0, 6) as ClubResult[]);
      } else {
        setResults([]);
      }
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isSearchOpen, doSearch]);

  function closeSearch() {
    setIsSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-surface-subtle border-b border-border">
      {/* Main bar */}
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {!isSearchOpen && (
          <Link href={homeHref} className="mr-auto">
            <span className="text-h2 font-bold tracking-tight text-brand">zenzo</span>
          </Link>
        )}

        {isSearchOpen ? (
          /* Expanded search input */
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && closeSearch()}
              placeholder="Search clubs, coaches…"
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-raised border border-border text-body text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>
        ) : (
          /* Search icon button */
          <button
            onClick={() => setIsSearchOpen(true)}
            className="size-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
            aria-label="Open search"
          >
            <Search className="size-[18px]" />
          </button>
        )}

        {isSearchOpen && (
          <button
            onClick={closeSearch}
            className="shrink-0 size-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
            aria-label="Close search"
          >
            <X className="size-4" />
          </button>
        )}

        {!isSearchOpen && user && (
          <AvatarDropdown
            initials={user.initials}
            avatarUrl={user.avatarUrl}
            fullName={user.fullName}
            hasClub={user.hasClub}
            clubSlug={user.clubSlug}
          />
        )}

        {!isSearchOpen && !user && (
          <Link
            href="/login"
            className="shrink-0 px-3 py-1.5 rounded-lg text-body-sm font-medium text-heading border border-border hover:bg-surface-raised transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Inline search results panel */}
      {isSearchOpen && (
        <div className="border-t border-border bg-surface-subtle shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-2">
            {loading ? (
              <div className="space-y-1 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                    <div className="skeleton-shimmer size-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton-shimmer h-3.5 w-32 rounded" />
                      <div className="skeleton-shimmer h-3 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-0.5 py-1">
                {results.map((club) => (
                  <Link
                    key={club.id}
                    href={`/clubs/${club.slug}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-raised transition-colors group"
                  >
                    <div className="size-8 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
                      <Building2 className="size-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-heading truncate group-hover:text-brand transition-colors">
                        {club.name}
                      </p>
                      {club.city && (
                        <p className="text-caption text-muted">{club.city}</p>
                      )}
                    </div>
                    {club.business_type && (
                      <span className="shrink-0 text-label text-muted">
                        {CATEGORY_LABELS[club.business_type] ?? club.business_type}
                      </span>
                    )}
                  </Link>
                ))}
                <div className="pt-1 border-t border-border mt-1">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&type=clubs`}
                    onClick={closeSearch}
                    className="block text-center text-caption text-brand hover:underline py-2"
                  >
                    See all results for &ldquo;{query}&rdquo; →
                  </Link>
                </div>
              </div>
            ) : searched && query.trim() ? (
              <div className="flex items-center justify-between py-3 px-3">
                <p className="text-caption text-muted">
                  No clubs found for &ldquo;{query}&rdquo;
                </p>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={closeSearch}
                  className="text-caption text-brand hover:underline"
                >
                  Search all →
                </Link>
              </div>
            ) : (
              <p className="text-caption text-muted py-3 px-3 text-center">
                Search clubs, coaches, and members
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
