// Root not-found page — shown when no route matches at all.

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-5">
        {/* Large 404 */}
        <p
          className="text-7xl font-bold tracking-tight"
          style={{ color: "var(--border-strong)" }}
          aria-hidden="true"
        >
          404
        </p>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-heading">Page not found</h1>
          <p className="text-body text-muted leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-medium text-foreground bg-surface-raised hover:bg-surface-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
