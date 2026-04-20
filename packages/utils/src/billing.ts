import { BillingCycle } from "@zenzo/database/enums";

/**
 * Calculate the next due date given a starting date and billing cycle.
 * Returns null for per_session plans (no recurring due date).
 */
export function calculateNextDueDate(
  fromDate: string,
  cycle: BillingCycle
): string | null {
  if (cycle === BillingCycle.PerSession) return null;

  const d = new Date(fromDate);

  if (cycle === BillingCycle.Monthly)    d.setMonth(d.getMonth() + 1);
  else if (cycle === BillingCycle.Quarterly)  d.setMonth(d.getMonth() + 3);
  else if (cycle === BillingCycle.HalfYearly) d.setMonth(d.getMonth() + 6);
  else if (cycle === BillingCycle.Annual)     d.setFullYear(d.getFullYear() + 1);

  return d.toISOString().slice(0, 10);
}
