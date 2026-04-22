"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, CheckCircle } from "lucide-react";
import type { ClubSearchResult, OperatingHours } from "./types";

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  gym:          { emoji: "🏋️", label: "Gym" },
  martial_arts: { emoji: "🥋", label: "Martial Arts" },
  dance:        { emoji: "💃", label: "Dance" },
  yoga:         { emoji: "🧘", label: "Yoga" },
  other:        { emoji: "⭐", label: "Other" },
};

const AMENITY_ICONS: Record<string, { icon: string; label: string }> = {
  ac:      { icon: "❄️", label: "AC" },
  parking: { icon: "🅿️", label: "Parking" },
  shower:  { icon: "🚿", label: "Shower" },
  locker:  { icon: "🔒", label: "Locker" },
  steam:   { icon: "♨️", label: "Steam" },
  sauna:   { icon: "🧖", label: "Sauna" },
  cafe:    { icon: "☕", label: "Café" },
  wifi:    { icon: "📶", label: "Wi-Fi" },
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function isOpenNow(hours: OperatingHours | null): boolean | null {
  if (!hours) return null;
  const dayKey = DAY_KEYS[new Date().getDay() as 0|1|2|3|4|5|6];
  const day = hours[dayKey];
  if (!day) return false;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const parts = (t: string) => t.split(":").map(Number) as [number, number];
  const [oh, om] = parts(day.open);
  const [ch, cm] = parts(day.close);
  return now >= oh * 60 + om && now < ch * 60 + cm;
}

function startingPrice(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

interface ClubCardProps {
  club: ClubSearchResult;
  showDistance?: boolean;
}

export function ClubCard({ club, showDistance }: ClubCardProps) {
  const meta = CATEGORY_META[club.business_type] ?? { emoji: "⭐", label: club.business_type };
  const openState = isOpenNow(club.operating_hours);
  const displayAmenities = (club.amenities ?? []).slice(0, 4);
  const extraAmenities = (club.amenities ?? []).length - 4;

  return (
    <Link
      href={`/clubs/${club.slug}`}
      role="article"
      aria-label={`${club.name} — View details`}
      className="group flex flex-col bg-surface-raised border border-border rounded-xl overflow-hidden hover:border-brand/50 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative h-40 bg-surface-subtle shrink-0">
        {club.cover_image_url ? (
          <Image
            src={club.cover_image_url}
            alt={club.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">
            {meta.emoji}
          </div>
        )}

        {club.is_verified && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-label font-medium text-emerald-600">
            <CheckCircle className="size-3" />
            Verified
          </div>
        )}

        {openState !== null && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-label font-medium backdrop-blur-sm ${openState ? "bg-emerald-500/90 text-white" : "bg-white/90 text-muted"}`}>
            <span className={`size-1.5 rounded-full ${openState ? "bg-white" : "bg-border"}`} />
            {openState ? "Open" : "Closed"}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="text-h3 text-heading leading-snug truncate group-hover:text-brand transition-colors">
          {club.name}
        </h3>

        {club.tagline && (
          <p className="text-caption text-muted line-clamp-1">{club.tagline}</p>
        )}

        <div className="flex gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-label font-medium bg-primary-subtle text-brand">
            <span className="text-xs">{meta.emoji}</span>
            {meta.label}
          </span>
          {(club.subcategories ?? []).slice(0, 2).map((sub) => (
            <span key={sub} className="px-2 py-0.5 rounded-md text-label font-medium bg-surface-subtle text-muted capitalize">
              {sub.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {club.avg_rating !== null && (
            <span className="flex items-center gap-1 text-caption font-medium text-heading">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {club.avg_rating.toFixed(1)}
              {club.review_count > 0 && (
                <span className="text-muted font-normal">({club.review_count})</span>
              )}
            </span>
          )}
          {(club.area ?? club.city) && (
            <span className="flex items-center gap-1 text-caption text-muted">
              <MapPin className="size-3 shrink-0" />
              {club.area ?? club.city}
            </span>
          )}
          {showDistance && club.distance_km !== null && (
            <span className="text-caption text-muted">
              {club.distance_km < 1
                ? `${Math.round(club.distance_km * 1000)}m away`
                : `${club.distance_km.toFixed(1)}km away`}
            </span>
          )}
        </div>

        {displayAmenities.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {displayAmenities.map((a) => {
              const info = AMENITY_ICONS[a];
              return info ? (
                <span key={a} title={info.label} className="text-sm" aria-label={info.label}>
                  {info.icon}
                </span>
              ) : null;
            })}
            {extraAmenities > 0 && (
              <span className="text-label text-muted">+{extraAmenities} more</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          {club.starting_price_paise !== null ? (
            <span className="text-caption font-semibold text-heading">
              From {startingPrice(club.starting_price_paise)}/mo
            </span>
          ) : (
            <span className="text-caption text-muted">Price on request</span>
          )}
          <span className="text-label font-medium text-brand group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ClubCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface-raised border border-border rounded-xl overflow-hidden">
      <div className="skeleton-shimmer h-40 shrink-0" />
      <div className="p-4 space-y-3">
        <div className="skeleton-shimmer h-5 w-3/4 rounded" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-5 w-20 rounded-md" />
          <div className="skeleton-shimmer h-5 w-16 rounded-md" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton-shimmer h-4 w-16 rounded" />
          <div className="skeleton-shimmer h-4 w-24 rounded" />
        </div>
        <div className="flex justify-between pt-2 border-t border-border/50">
          <div className="skeleton-shimmer h-4 w-28 rounded" />
          <div className="skeleton-shimmer h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}
