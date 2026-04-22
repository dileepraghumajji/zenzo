"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@zenzo/ui";
import { Sheet, SheetContent, SheetTrigger, SheetFooter } from "@zenzo/ui";
import { AMENITY_OPTIONS, SPECIALIZATION_OPTIONS } from "@zenzo/database";
import type { FilterState } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "",             label: "All" },
  { value: "gym",          label: "Gym" },
  { value: "yoga",         label: "Yoga" },
  { value: "martial_arts", label: "Martial Arts" },
  { value: "dance",        label: "Dance" },
  { value: "other",        label: "Other" },
];

const PRICE_RANGES = [
  { value: "",        label: "Any" },
  { value: "budget",  label: "Budget" },
  { value: "mid",     label: "Mid" },
  { value: "premium", label: "Premium" },
];

const MIN_RATINGS = [
  { value: 0, label: "Any" },
  { value: 4, label: "4+ ★" },
  { value: 3, label: "3+ ★" },
];

const SORT_OPTIONS = [
  { value: "relevance",  label: "Relevance" },
  { value: "distance",   label: "Distance" },
  { value: "rating",     label: "Top Rated" },
  { value: "price_asc",  label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "popularity", label: "Popularity" },
  { value: "newest",     label: "Newest" },
];

const AVAILABILITY_OPTIONS = [
  { value: "",          label: "Any" },
  { value: "available", label: "Available Now" },
  { value: "busy",      label: "Accepting Clients" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countActive(f: FilterState): number {
  let n = 0;
  if (f.category)                n++;
  if (f.subcategories.length)    n++;
  if (f.amenities.length)        n++;
  if (f.specializations.length)  n++;
  if (f.price_range)             n++;
  if (f.min_rating > 0)          n++;
  if (f.availability)            n++;
  if (f.sort && f.sort !== "relevance") n++;
  return n;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border pb-4 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 text-body font-semibold text-heading"
      >
        <span className="flex items-center gap-2">
          {title}
          {(count ?? 0) > 0 && (
            <span className="size-5 text-label rounded-full bg-brand text-white flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
}

function MultiChips({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-caption font-medium border transition-all active:scale-95",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface-raised border-border text-muted hover:border-brand/40"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SinglePills<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-caption font-medium border transition-all active:scale-95",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface-raised border-border text-muted hover:border-brand/40"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── AdvancedFilters ─────────────────────────────────────────────────────────

const CLEARED: FilterState = {
  category: "",
  subcategories: [],
  amenities: [],
  specializations: [],
  price_range: "",
  min_rating: 0,
  availability: "",
  sort: "relevance",
};

interface AdvancedFiltersProps {
  filters: FilterState;
  onApply: (f: FilterState) => void;
  mode?: "clubs" | "coaches" | "all";
}

export function AdvancedFilters({ filters, onApply, mode = "all" }: AdvancedFiltersProps) {
  const [draft, setDraft] = useState<FilterState>({ ...filters });
  const [open, setOpen] = useState(false);
  const activeCount = countActive(filters);

  function update<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  function handleClear() {
    setDraft({ ...CLEARED });
    onApply({ ...CLEARED });
    setOpen(false);
  }

  const draftCount = countActive(draft);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft({ ...filters });
      }}
    >
      <SheetTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-caption font-medium border transition-all",
            activeCount > 0
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface-raised border-border text-muted hover:border-brand/40 hover:text-heading"
          )}
          aria-label="Search filters"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="size-4 text-label rounded-full bg-white/30 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent title="Filters" aria-label="Search filters">
        <div className="space-y-1">
          <FilterSection title="Sort By" count={draft.sort && draft.sort !== "relevance" ? 1 : 0}>
            <SinglePills
              options={SORT_OPTIONS}
              value={draft.sort || "relevance"}
              onChange={(v) => update("sort", v)}
            />
          </FilterSection>

          {(mode === "clubs" || mode === "all") && (
            <FilterSection title="Category" count={draft.category ? 1 : 0}>
              <SinglePills
                options={CATEGORIES}
                value={draft.category}
                onChange={(v) => update("category", v)}
              />
            </FilterSection>
          )}

          {(mode === "clubs" || mode === "all") && (
            <FilterSection title="Amenities" count={draft.amenities.length || undefined}>
              <MultiChips
                options={AMENITY_OPTIONS}
                value={draft.amenities}
                onChange={(v) => update("amenities", v)}
              />
            </FilterSection>
          )}

          {(mode === "coaches" || mode === "all") && (
            <FilterSection title="Specializations" count={draft.specializations.length || undefined}>
              <MultiChips
                options={SPECIALIZATION_OPTIONS}
                value={draft.specializations}
                onChange={(v) => update("specializations", v)}
              />
            </FilterSection>
          )}

          <FilterSection title="Price Range" count={draft.price_range ? 1 : 0}>
            <SinglePills
              options={PRICE_RANGES}
              value={draft.price_range}
              onChange={(v) => update("price_range", v)}
            />
          </FilterSection>

          <FilterSection title="Minimum Rating" count={draft.min_rating > 0 ? 1 : 0}>
            <SinglePills
              options={MIN_RATINGS}
              value={draft.min_rating}
              onChange={(v) => update("min_rating", v)}
            />
          </FilterSection>

          {(mode === "coaches" || mode === "all") && (
            <FilterSection title="Availability" count={draft.availability ? 1 : 0}>
              <SinglePills
                options={AVAILABILITY_OPTIONS}
                value={draft.availability}
                onChange={(v) => update("availability", v)}
              />
            </FilterSection>
          )}
        </div>

        <SheetFooter className="mt-6">
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-lg border border-border text-body font-medium text-heading hover:bg-surface-subtle transition"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-body font-medium hover:bg-primary/90 transition"
          >
            Apply{draftCount > 0 ? ` (${draftCount})` : ""}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
