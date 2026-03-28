"use client";

// Adapted from shadcn/ui Input skeleton (https://ui.shadcn.com/docs/components/input)
// Base accessibility + structure from shadcn. Restyled with Zenzo semantic tokens.
// Extended with: prefix slot, suffix slot, error state.

import * as React from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  /**
   * Left-side decoration — icon or static text (e.g. <Mail />, "+91").
   * Always non-interactive (pointer-events-none). For interactive left
   * elements use a separate element outside the Input.
   */
  prefix?: React.ReactNode;
  /**
   * Right-side element — typically an icon button (e.g. show/hide password,
   * clear button). Pointer events are preserved — pass an interactive element.
   */
  suffix?: React.ReactNode;
  /**
   * Puts the input into error state (red border + focus ring).
   * Error message text lives in the parent <FormField error="..."> — not here.
   */
  error?: boolean;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ prefix, suffix, error = false, disabled, className, ...props }, ref) => {
    const hasPrefix = !!prefix;
    const hasSuffix = !!suffix;

    return (
      <div className={cn("relative flex items-center w-full", className)}>

        {/* Prefix — always decorative, never interactive */}
        {hasPrefix && (
          <div
            className="absolute left-3 flex items-center pointer-events-none text-muted [&_svg]:size-4"
            aria-hidden="true"
          >
            {prefix}
          </div>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            // Base layout — 48px on mobile (touch targets), 40px on md+ (density)
            "w-full h-12 md:h-10 rounded-md bg-background",
            // Typography
            "text-body text-foreground placeholder:text-placeholder",
            // Border + transition
            "border transition-colors duration-standard",
            // Focus ring — keyboard nav only
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            // Disabled
            "disabled:bg-surface-subtle disabled:cursor-not-allowed disabled:text-muted",
            // Horizontal padding — adjust for prefix/suffix presence
            hasPrefix ? "pl-10" : "pl-3",
            hasSuffix ? "pr-10" : "pr-3",
            // State: error vs normal
            // Normal: hover shows stone-300 border; focus shows forge-500 ring + stone-300 border
            error
              ? "border-error-accent focus-visible:ring-error-accent"
              : "border-border hover:border-border-strong focus-visible:ring-ring focus-visible:border-border-strong"
          )}
          {...props}
        />

        {/* Suffix — can be interactive (e.g. show/hide button) */}
        {hasSuffix && (
          <div className="absolute right-3 flex items-center text-muted [&_svg]:size-4">
            {suffix}
          </div>
        )}

      </div>
    );
  }
);

Input.displayName = "Input";
