/**
 * Format a due date string into a human-readable label.
 * Returns { label, urgent } where urgent=true when the date is today or past.
 */
export function formatDueDate(dateStr: string | null): { label: string; urgent: boolean } {
  if (!dateStr) return { label: "—", urgent: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    return { label: `${n} day${n !== 1 ? "s" : ""} overdue`, urgent: true };
  }
  if (diffDays === 0) return { label: "Due today", urgent: true };

  const label = "Due " + due.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return { label, urgent: false };
}

/** Format paise to INR string — e.g. 49900 → ₹499.00 */
export function formatCurrency(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
