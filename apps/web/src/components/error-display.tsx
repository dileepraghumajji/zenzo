"use client";

// ErrorDisplay — reusable error UI for error.tsx boundaries.
// Shows an icon, heading, message, and optional retry button.
// Styled with Zenzo warm design tokens.

import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorDisplayProps = {
  heading?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorDisplay({
  heading = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-5">
        {/* Icon */}
        <div
          className="size-14 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "var(--status-error-bg)" }}
          aria-hidden="true"
        >
          <AlertTriangle
            className="size-7"
            style={{ color: "var(--status-error-text)" }}
          />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-heading">{heading}</h2>
          <p className="text-body text-muted leading-relaxed">{message}</p>
        </div>

        {/* Retry */}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-medium text-foreground bg-surface-raised hover:bg-surface-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
