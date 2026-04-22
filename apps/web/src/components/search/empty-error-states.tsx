"use client";

interface NoResultsProps {
  query?: string;
  category?: string;
  onClearFilters?: () => void;
}

export function NoResults({ query, category, onClearFilters }: NoResultsProps) {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-5xl">🔍</div>
      <div className="space-y-2">
        <p className="text-h3 text-heading">No results found</p>
        <p className="text-body text-muted max-w-xs mx-auto">
          {query
            ? `We couldn't find anything for "${query}"${category ? ` in ${category}` : ""}. Try different keywords or clear your filters.`
            : "Try adjusting your filters or searching in a different area."}
        </p>
      </div>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 rounded-lg border border-border text-body text-muted hover:border-brand/40 hover:text-heading transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-5xl">⚠️</div>
      <div className="space-y-2">
        <p className="text-h3 text-heading">Something went wrong</p>
        <p className="text-body text-muted">We couldn&apos;t load results. Please try again.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-body font-medium hover:bg-primary/90 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function LocationDenied() {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-caption">
      <span aria-hidden>📍</span>
      <span>
        Location access denied. Please enable it in your browser settings to use nearby search.
      </span>
    </div>
  );
}
