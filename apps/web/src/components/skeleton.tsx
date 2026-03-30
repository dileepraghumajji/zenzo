// Skeleton — shimmer placeholder for loading states.
// Uses the `skeleton-shimmer` class from globals.css.

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}
