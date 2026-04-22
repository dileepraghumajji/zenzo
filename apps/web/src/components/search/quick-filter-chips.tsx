"use client";

import { cn } from "@zenzo/ui";

interface FilterChip {
  value: string;
  label: string;
  emoji?: string;
}

const CHIPS: FilterChip[] = [
  { value: "",             label: "All" },
  { value: "gym",          label: "Gyms",        emoji: "🏋️" },
  { value: "yoga",         label: "Yoga",         emoji: "🧘" },
  { value: "martial_arts", label: "Martial Arts", emoji: "🥋" },
  { value: "dance",        label: "Dance",        emoji: "💃" },
  { value: "coaches",      label: "Coaches",      emoji: "👤" },
];

interface QuickFilterChipsProps {
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuickFilterChips({ active, onChange, className }: QuickFilterChipsProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-none", className)}>
      {CHIPS.map((chip) => {
        const isActive = active === chip.value;
        return (
          <button
            key={chip.value}
            onClick={() => onChange(chip.value)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium border",
              "transition-all duration-150 active:scale-95",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-surface-raised border-border text-muted hover:border-brand/40 hover:text-heading"
            )}
          >
            {chip.emoji && <span className="text-xs leading-none">{chip.emoji}</span>}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
