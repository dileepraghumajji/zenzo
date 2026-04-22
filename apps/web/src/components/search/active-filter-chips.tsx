"use client";

import { X } from "lucide-react";
import { AMENITY_OPTIONS, SPECIALIZATION_OPTIONS } from "@zenzo/database";
import type { FilterState } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  gym:          "Gym",
  yoga:         "Yoga",
  martial_arts: "Martial Arts",
  dance:        "Dance",
  other:        "Other",
};

const PRICE_LABELS: Record<string, string> = {
  budget:  "Budget",
  mid:     "Mid-range",
  premium: "Premium",
};

const SORT_LABELS: Record<string, string> = {
  distance:   "Nearest",
  rating:     "Top Rated",
  price_asc:  "Price ↑",
  price_desc: "Price ↓",
  popularity: "Popular",
  newest:     "Newest",
};

interface Chip {
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  filters: FilterState;
  onRemove: (patch: Partial<FilterState>) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  const chips: Chip[] = [];

  if (filters.category) {
    chips.push({
      label: CATEGORY_LABELS[filters.category] ?? filters.category,
      onRemove: () => onRemove({ category: "" }),
    });
  }
  if (filters.price_range) {
    chips.push({
      label: PRICE_LABELS[filters.price_range] ?? filters.price_range,
      onRemove: () => onRemove({ price_range: "" }),
    });
  }
  if (filters.min_rating > 0) {
    chips.push({
      label: `${filters.min_rating}+ stars`,
      onRemove: () => onRemove({ min_rating: 0 }),
    });
  }
  if (filters.sort && filters.sort !== "relevance") {
    chips.push({
      label: SORT_LABELS[filters.sort] ?? filters.sort,
      onRemove: () => onRemove({ sort: "relevance" }),
    });
  }
  if (filters.availability) {
    chips.push({
      label: filters.availability === "available" ? "Available Now" : "Accepting Clients",
      onRemove: () => onRemove({ availability: "" }),
    });
  }
  filters.amenities.forEach((a) => {
    const opt = AMENITY_OPTIONS.find((o) => o.value === a);
    chips.push({
      label: opt?.label ?? a,
      onRemove: () => onRemove({ amenities: filters.amenities.filter((x) => x !== a) }),
    });
  });
  filters.specializations.forEach((s) => {
    const opt = SPECIALIZATION_OPTIONS.find((o) => o.value === s);
    chips.push({
      label: opt?.label ?? s,
      onRemove: () => onRemove({ specializations: filters.specializations.filter((x) => x !== s) }),
    });
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-caption font-medium bg-surface-brand border border-brand/20 text-brand"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-0.5 hover:bg-brand/10 rounded-full p-0.5 transition"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-caption text-muted hover:text-brand transition underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
