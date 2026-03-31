// ─── Reports Page ─────────────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/reports
//
// P1.3 — Coming in Phase 1.5.
// Owner-only. Coaches do not see this nav item.

import { BarChart2, TrendingUp, Users, RefreshCw } from "lucide-react";

export const metadata = { title: "Reports" };

const PLANNED_REPORTS = [
  {
    icon: BarChart2,
    title: "Revenue",
    description: "Collected vs outstanding, monthly trend, breakdown by payment method. CSV export.",
  },
  {
    icon: TrendingUp,
    title: "Attendance",
    description: "Average rate per batch, at-risk members (3+ absences), batch-wise breakdown. CSV export.",
  },
  {
    icon: Users,
    title: "Member Growth",
    description: "New members vs churned by month, net growth trend. CSV export.",
  },
  {
    icon: RefreshCw,
    title: "Retention",
    description: "Retention rate, average member tenure, cohort analysis, churn risk list. CSV export.",
  },
];

export default function ReportsPage() {
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[22px] font-bold text-foreground">Reports</h1>
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-surface-subtle border border-border text-muted px-2.5 py-0.5 rounded-full">
            Coming Soon
          </span>
        </div>
        <p className="text-[13px] text-muted">
          Revenue, attendance, and growth analytics for your club.
        </p>
      </div>

      {/* Feature preview — greyed out */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-40 pointer-events-none select-none">
        {PLANNED_REPORTS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-background p-5 flex gap-4"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-subtle flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground mb-1">{title}</p>
              <p className="text-[12px] text-muted leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA note */}
      <p className="mt-8 text-center text-[12px] text-muted">
        Reports will be available in an upcoming release.
      </p>
    </div>
  );
}
