"use client";

// Global error boundary — catches errors in root layout itself.
// Must render its own <html>/<body> since root layout may be broken.

import { ErrorDisplay } from "@/components/error-display";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          backgroundColor: "var(--surface-page, #FAF9F7)",
          fontFamily: "var(--font-inter, system-ui, sans-serif)",
        }}
      >
        <ErrorDisplay
          heading="Something went wrong"
          message="A critical error occurred. Please refresh the page."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
