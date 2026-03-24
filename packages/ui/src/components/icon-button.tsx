"use client";

import * as React from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to render — accepts any ReactNode, optimised for Lucide icons */
  icon: React.ReactNode;
  /** REQUIRED — used as aria-label and native tooltip. Never skip this. */
  label: string;
  variant?: "ghost" | "primary" | "danger";
  size?: "sm" | "md";
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variants: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  ghost:
    "bg-transparent text-foreground hover:bg-surface-subtle active:bg-surface-subtle border border-transparent",
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover border border-transparent",
  danger:
    "bg-transparent text-muted hover:bg-error hover:text-error-foreground active:bg-error border border-transparent",
};

// Size = the button box. Touch target is always ≥ 44px on mobile via min-h/min-w.
const sizes: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "size-8  rounded-md [&_svg]:size-4",  // 32px box
  md: "size-10 rounded-md [&_svg]:size-5",  // 40px box
};

// ─── IconButton ───────────────────────────────────────────────────────────────

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = "ghost",
      size = "md",
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        // Layout — square, centred icon
        "inline-flex items-center justify-center shrink-0",
        // Transitions
        "transition-colors duration-150",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        // Mobile: ensure 44×44 tap target for sm buttons
        size === "sm" && "min-h-[44px] min-w-[44px] md:min-h-8 md:min-w-8",
        // Variant + size
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        {icon}
      </span>
    </button>
  )
);

IconButton.displayName = "IconButton";
