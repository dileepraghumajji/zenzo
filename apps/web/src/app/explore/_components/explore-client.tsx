"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { ClubCategory } from "@zenzo/database/enums";

// ─── Category labels ────────────────────────────────────────────────────────

const CATEGORIES: { value: string; label: string }[] = [
  { value: "",                       label: "All"         },
  { value: ClubCategory.Gym,         label: "Gym"         },
  { value: ClubCategory.MartialArts, label: "Martial Arts"},
  { value: ClubCategory.Dance,       label: "Dance"       },
  { value: ClubCategory.Yoga,        label: "Yoga"        },
  { value: ClubCategory.Other,       label: "Other"       },
];

// ─── Search bar ─────────────────────────────────────────────────────────────

export function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const onSearch = useCallback(
    (value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`);
    },
    [router, pathname, params],
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder="Search clubs by name…"
        onChange={(e) => onSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface-raised text-body text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
      />
    </div>
  );
}

// ─── Category filter chips ───────────────────────────────────────────────────

export function CategoryChips({ selected }: { selected: string }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const onSelect = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("category", value);
    else next.delete("category");
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map((cat) => {
        const active = selected === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => onSelect(cat.value)}
            className={`px-3 py-1 rounded-full text-caption font-medium border transition
              ${active
                ? "bg-brand text-white border-brand"
                : "bg-surface-raised border-border text-muted hover:border-brand/40 hover:text-heading"
              }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
