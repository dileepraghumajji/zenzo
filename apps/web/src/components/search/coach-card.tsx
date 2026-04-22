"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { CoachSearchResult } from "./types";

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function startingPrice(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

interface CoachCardProps {
  coach: CoachSearchResult;
  showDistance?: boolean;
}

export function CoachCard({ coach, showDistance }: CoachCardProps) {
  const specs = (coach.specializations ?? []).slice(0, 3);
  const primaryClub = coach.affiliated_clubs[0];

  return (
    <Link
      href={`/coaches/${coach.user_id}`}
      role="article"
      aria-label={`${coach.display_name} — View profile`}
      className="group flex gap-4 bg-surface-raised border border-border rounded-xl p-4 hover:border-brand/50 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="size-16 rounded-full bg-primary flex items-center justify-center text-heading font-bold text-white overflow-hidden">
          {coach.avatar_url ? (
            <Image
              src={coach.avatar_url}
              alt={coach.display_name}
              fill
              sizes="64px"
              className="object-cover rounded-full"
            />
          ) : (
            <span>{initials(coach.display_name)}</span>
          )}
        </div>
        <span
          className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-surface-raised ${coach.is_available ? "bg-emerald-500" : "bg-amber-400"}`}
          title={coach.is_available ? "Available" : "Busy"}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-h3 text-heading truncate group-hover:text-brand transition-colors">
            {coach.display_name}
          </h3>
          <span className="text-label font-medium text-brand opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            View →
          </span>
        </div>

        {specs.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {specs.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full text-label font-medium bg-primary-subtle text-brand capitalize">
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {coach.avg_rating !== null && (
            <span className="flex items-center gap-1 text-caption font-medium text-heading">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {coach.avg_rating.toFixed(1)}
              {coach.review_count > 0 && (
                <span className="text-muted font-normal">({coach.review_count})</span>
              )}
            </span>
          )}
          {coach.experience_years !== null && (
            <span className="text-caption text-muted">{coach.experience_years} yrs exp</span>
          )}
          {(coach.area ?? coach.city) && (
            <span className="flex items-center gap-1 text-caption text-muted">
              <MapPin className="size-3 shrink-0" />
              {coach.area ?? coach.city}
            </span>
          )}
          {showDistance && coach.distance_km !== null && (
            <span className="text-caption text-muted">
              {coach.distance_km < 1 ? `${Math.round(coach.distance_km * 1000)}m` : `${coach.distance_km.toFixed(1)}km`} away
            </span>
          )}
        </div>

        {(coach.languages ?? []).length > 0 && (
          <p className="text-label text-muted">{coach.languages!.join(", ")}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          {primaryClub ? (
            <span className="text-caption text-muted truncate">{primaryClub.club_name}</span>
          ) : (
            <span className="text-label text-muted italic">Freelance</span>
          )}
          {coach.session_price_paise !== null && (
            <span className="text-caption font-semibold text-heading shrink-0">
              {startingPrice(coach.session_price_paise)}/session
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CoachCardSkeleton() {
  return (
    <div className="flex gap-4 bg-surface-raised border border-border rounded-xl p-4">
      <div className="skeleton-shimmer size-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton-shimmer h-5 w-2/3 rounded" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-4 w-20 rounded-full" />
          <div className="skeleton-shimmer h-4 w-16 rounded-full" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton-shimmer h-3 w-12 rounded" />
          <div className="skeleton-shimmer h-3 w-20 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="skeleton-shimmer h-3 w-24 rounded" />
          <div className="skeleton-shimmer h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}
