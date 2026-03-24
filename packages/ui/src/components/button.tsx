"use client";

import * as React from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover border border-transparent",
  secondary:
    "bg-background text-foreground border border-border hover:bg-surface-subtle active:bg-surface-subtle",
  ghost:
    "bg-transparent text-foreground border border-transparent hover:bg-surface-subtle active:bg-surface-subtle",
  danger:
    "bg-destructive text-destructive-foreground border border-transparent hover:bg-destructive-hover active:bg-destructive-hover",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  // h-8 = 32px, h-10 = 40px, h-12 = 48px (from our 4px spacing scale)
  sm: "h-8 px-3 text-[13px] rounded-md gap-1.5 [&_svg]:size-3.5",
  md: "h-10 px-4 text-[14px] rounded-md gap-2   [&_svg]:size-4",
  lg: "h-12 px-5 text-[14px] rounded-md gap-2   [&_svg]:size-5",
};

// Spinner color follows button variant
const spinnerColor: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:   "text-primary-foreground",
  secondary: "text-muted",
  ghost:     "text-muted",
  danger:    "text-destructive-foreground",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const sz = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";
  return (
    <svg
      className={cn("animate-spin shrink-0", sz, spinnerColor[variant!])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Layout
          "relative inline-flex items-center justify-center font-medium",
          "select-none whitespace-nowrap",
          // Transitions
          "transition-colors duration-150 ease-standard",
          // Focus ring — keyboard navigation only, never on mouse click
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2",
          // Disabled
          "disabled:pointer-events-none disabled:opacity-50",
          // Variant + size
          variants[variant],
          sizes[size],
          // Mobile touch target: sm buttons get min 44px height on mobile
          // md (40px) and lg (48px) are close enough / exceed the threshold
          size === "sm" && "min-h-[44px] md:min-h-8",
          // Full width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            {/*
              Ghost content: invisible but present — prevents width collapse.
              The spinner overlays this absolutely.
            */}
            <span
              className="invisible inline-flex items-center gap-2"
              aria-hidden="true"
            >
              {icon && <span className="shrink-0">{icon}</span>}
              <span>{children}</span>
              {iconRight && <span className="shrink-0">{iconRight}</span>}
            </span>
            {/* Spinner centred over ghost content */}
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner variant={variant} size={size} />
            </span>
          </>
        ) : (
          <>
            {icon && (
              <span className="shrink-0 flex items-center" aria-hidden="true">
                {icon}
              </span>
            )}
            {children}
            {iconRight && (
              <span className="shrink-0 flex items-center" aria-hidden="true">
                {iconRight}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
