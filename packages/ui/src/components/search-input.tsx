"use client";

// ─── SearchInput ───────────────────────────────────────────────────────────────
//
// A controlled search field with a leading search icon and an optional clear
// button that appears when the field has a value.
//
// Debouncing is the consumer's responsibility — this component stays dumb and
// just forwards value/onChange.

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "prefix"> {
  /** Called when the clear button is pressed — typically sets value to "". */
  onClear?: () => void;
  className?: string;
}

// ─── SearchInput ──────────────────────────────────────────────────────────────

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, className, ...props }, ref) => {
    const hasValue = !!value && String(value).length > 0;

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        prefix={<Search className="text-muted-foreground" />}
        suffix={
          hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className={cn(
                "flex items-center justify-center rounded",
                "text-muted-foreground hover:text-foreground transition-colors"
              )}
            >
              <X className="size-4" />
            </button>
          ) : undefined
        }
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
