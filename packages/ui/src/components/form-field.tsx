// FormField — label + input slot + error/hint text.
//
// Usage:
//   <FormField label="Email" htmlFor="email" error={errors.email}>
//     <Input id="email" type="email" error={!!errors.email} />
//   </FormField>
//
// The `error` prop on FormField renders the message text.
// The `error` prop on Input triggers the red border.
// Both need to be set — FormField does not auto-inject error into children.

import * as React from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** Field label — rendered as <label> tied to htmlFor */
  label: string;
  /** Must match the id on the child input for accessibility */
  htmlFor?: string;
  /** Error message — renders below the input in error colour with role="alert" */
  error?: string;
  /** Hint text — rendered below the input in muted colour (hidden when error is set) */
  hint?: string;
  /** Adds a visual * after the label */
  required?: boolean;
  /**
   * Element rendered right-aligned on the same row as the label.
   * Use for contextual actions e.g. "Forgot password?", "View all".
   */
  labelRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  labelRight,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>

      {/* Label row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-label font-medium uppercase tracking-[0.05em] text-muted"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-error-accent" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {labelRight && (
          <span className="text-label">{labelRight}</span>
        )}
      </div>

      {/* Input slot */}
      {children}

      {/* Error (priority) or hint */}
      {error ? (
        <p role="alert" className="text-caption text-error-foreground">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption text-muted">{hint}</p>
      ) : null}

    </div>
  );
}
