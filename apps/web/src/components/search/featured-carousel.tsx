"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { ClubSearchResult } from "./types";

const CATEGORY_EMOJI: Record<string, string> = {
  gym:          "🏋️",
  martial_arts: "🥋",
  dance:        "💃",
  yoga:         "🧘",
  other:        "⭐",
};

function ItemSkeleton() {
  return (
    <div className="shrink-0 w-52 rounded-xl overflow-hidden border border-border">
      <div className="skeleton-shimmer h-32" />
      <div className="p-3 space-y-2">
        <div className="skeleton-shimmer h-4 w-4/5 rounded" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function FeaturedCarousel() {
  const [clubs, setClubs] = useState<ClubSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search/featured")
      .then((r) => (r.ok ? r.json() : { clubs: [] }))
      .then((data: { clubs: ClubSearchResult[] }) => setClubs(data.clubs ?? []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && clubs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-h3 text-heading">Featured clubs</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ItemSkeleton key={i} />)
          : clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.slug}`}
                className="shrink-0 w-52 rounded-xl overflow-hidden border border-border hover:border-brand/50 hover:shadow-md transition-all group"
              >
                <div className="relative h-32 bg-surface-subtle">
                  {club.cover_image_url ? (
                    <Image
                      src={club.cover_image_url}
                      alt={club.name}
                      fill
                      sizes="208px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl select-none">
                      {CATEGORY_EMOJI[club.business_type] ?? "⭐"}
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-label font-medium bg-white/90 text-heading backdrop-blur-sm capitalize">
                    {CATEGORY_EMOJI[club.business_type]} {club.business_type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="p-3 space-y-0.5">
                  <p className="text-body font-semibold text-heading truncate group-hover:text-brand transition-colors">
                    {club.name}
                  </p>
                  {club.avg_rating !== null && (
                    <p className="flex items-center gap-1 text-caption text-muted">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {club.avg_rating.toFixed(1)}
                      {club.review_count > 0 && <span>({club.review_count})</span>}
                    </p>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
