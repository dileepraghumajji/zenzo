// Dashboard not-found — shown when an invalid sub-route is accessed.
// Sidebar stays visible since this is inside the dashboard layout.

import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-5">
        <p
          className="text-6xl font-bold tracking-tight"
          style={{ color: "var(--border-strong)" }}
          aria-hidden="true"
        >
          404
        </p>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-heading">
            Page not found
          </h2>
          <p className="text-body text-muted leading-relaxed">
            This page doesn&apos;t exist in your dashboard.
          </p>
        </div>

        <Link
          href="."
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-medium text-foreground bg-surface-raised hover:bg-surface-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
