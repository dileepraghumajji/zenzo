"use client";

const CATEGORY_PLURAL: Record<string, string> = {
  gym:          "gyms",
  martial_arts: "martial arts clubs",
  dance:        "dance studios",
  yoga:         "yoga studios",
  other:        "clubs",
};

interface ResultCountProps {
  total: number;
  category?: string;
  city?: string;
  loading?: boolean;
}

export function ResultCount({ total, category, city, loading }: ResultCountProps) {
  if (loading) return <div className="skeleton-shimmer h-4 w-48 rounded" />;

  const what = category ? (CATEGORY_PLURAL[category] ?? "clubs") : "results";
  const where = city ? ` in ${city}` : "";

  return (
    <p className="text-caption text-muted">
      Showing <span className="font-medium text-heading">{total}</span> {what}{where}
    </p>
  );
}
