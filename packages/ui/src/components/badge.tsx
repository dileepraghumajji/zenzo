import * as React from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BadgeProps {
  variant?: "neutral" | "success" | "warning" | "error" | "info" | "primary";
  size?: "sm" | "md";
  label: string;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

// ─── Status mappings (use these, never guess) ─────────────────────────────────
//
//   Active / Present     → success
//   Overdue / Absent     → error
//   Expiring Soon        → warning
//   Trial / Pending      → info
//   Inactive / Unmarked  → neutral
//   Belt rank / Category → primary

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyles = {
  neutral: {
    badge: "bg-surface-subtle text-foreground",
    dot:   "bg-muted",
  },
  success: {
    badge: "bg-success text-success-foreground",
    dot:   "bg-success-accent",
  },
  warning: {
    badge: "bg-warning text-warning-foreground",
    dot:   "bg-warning-accent",
  },
  error: {
    badge: "bg-error text-error-foreground",
    dot:   "bg-error-accent",
  },
  info: {
    badge: "bg-info text-info-foreground",
    dot:   "bg-info-accent",
  },
  primary: {
    badge: "bg-primary-subtle text-brand",
    dot:   "bg-primary",
  },
} as const;

const sizeStyles = {
  // h-5 = 20px  / h-6 = 24px
  sm: "h-5 px-1.5 text-[11px] gap-1",
  md: "h-6 px-2   text-[12px] gap-1.5",
} as const;

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
  variant = "neutral",
  size = "md",
  label,
  icon,
  dot = false,
  className,
}: BadgeProps) {
  const style = variantStyles[variant];

  return (
    <span
      className={cn(
        // Layout
        "inline-flex items-center",
        // Shape: pill
        "rounded-full",
        // Typography: always uppercase + tracked
        "font-medium uppercase tracking-[0.05em] leading-none",
        // Whitespace
        "whitespace-nowrap",
        // Variant + size
        style.badge,
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn("shrink-0 rounded-full size-1.5", style.dot)}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </span>
  );
}

Badge.displayName = "Badge";
