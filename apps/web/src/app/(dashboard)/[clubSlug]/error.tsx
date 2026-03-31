"use client";

// Dashboard error boundary — sidebar/bottom-nav stay intact.
// Only the main content area shows the error.

import { ErrorDisplay } from "@/components/error-display";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      heading="Something went wrong"
      message={
        error.message && error.message !== "An error occurred in the Server Components render."
          ? error.message
          : "An unexpected error occurred. Please try again."
      }
      onRetry={reset}
    />
  );
}
