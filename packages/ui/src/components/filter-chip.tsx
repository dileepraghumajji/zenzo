"use client";

// ─── FilterChip ────────────────────────────────────────────────────────────────
//
// A pill-shaped toggle for filter bars — status, category, batch, etc.
//
// Usage:
//   <FilterChip selected={filter === "active"} onClick={() => setFilter("active")}>
//     Active
//   </FilterChip>
//
//   <FilterChip selected={...} onClick={...} count={42}>
//     Active
//   </FilterChip>

import * as React from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  selected?: boolean;
  /** Optional count badge rendered inline after the label text. */
  count?: number;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

export function FilterChip({
  selected = false,
  count,
  onClick,
  children,
  className,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        // Base shape + layout
        "inline-flex items-center gap-1 h-8 px-3 rounded-full",
        "shrink-0 whitespace-nowrap select-none",
        // Typography
        "text-[13px] font-medium",
        // Border always present (keeps width stable on selection change)
        "border transition-colors duration-150",
        // State
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-surface-subtle",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        // Mobile touch target
        "min-h-[44px] md:min-h-8",
        className
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "text-[12px] font-normal leading-none",
            selected ? "opacity-75" : "text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

FilterChip.displayName = "FilterChip";
