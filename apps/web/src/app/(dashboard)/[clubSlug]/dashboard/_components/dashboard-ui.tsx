// ─── Dashboard UI Primitives ──────────────────────────────────────────────────
//
// Reusable building blocks for both owner and coach dashboard views.
//
//   StatCard       — KPI tile with label / value / optional subtext + action
//   SectionCard    — titled card wrapper for list sections
//   EmptySection   — empty state inside a SectionCard
//   DashboardSkeleton — shimmer placeholder for the whole dashboard

"use client";

import * as React from "react";
import { cn } from "@zenzo/ui";
import { Skeleton } from "@/components/skeleton";

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardDelta {
  label: string;                         // e.g. "+5 this week" or "▲12% vs last month"
  direction: "up" | "down" | "neutral";  // colours the indicator
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  /** Optional delta indicator shown below the value */
  delta?: StatCardDelta;
  /** Optional coloured accent on the left border */
  accent?: "default" | "error" | "success" | "warning";
  /** Small action link/button rendered below the sub text */
  action?: React.ReactNode;
  className?: string;
}

const ACCENT_CLASS: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "border-l-border",
  error:   "border-l-error",
  success: "border-l-success",
  warning: "border-l-warning",
};

const DELTA_CLASS: Record<StatCardDelta["direction"], string> = {
  up:      "text-success",
  down:    "text-error-foreground",
  neutral: "text-muted",
};

export function StatCard({
  label,
  value,
  sub,
  delta,
  accent = "default",
  action,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border border-l-4 bg-background p-4",
        ACCENT_CLASS[accent],
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted mb-1">
        {label}
      </p>
      <p className="text-[24px] font-bold text-foreground leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-[12px] text-muted mt-1 font-mono">{sub}</p>
      )}
      {delta && (
        <p className={cn("text-[11px] font-medium mt-1", DELTA_CLASS[delta.direction])}>
          {delta.label}
        </p>
      )}
      {action && (
        <div className="mt-3 pt-2 border-t border-border/50">{action}</div>
      )}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle">
        <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted">
          {title}
        </p>
        {action && <div className="text-[12px]">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── EmptySection ─────────────────────────────────────────────────────────────

export function EmptySection({ message }: { message: string }) {
  return (
    <p className="text-[13px] text-muted text-center py-8 px-4">{message}</p>
  );
}

// ─── KPITimestamp ─────────────────────────────────────────────────────────────
// Client component: records mount time and updates every minute.

export function KPITimestamp() {
  const [mountedAt] = React.useState(() => Date.now());
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const diffMin = Math.floor((Date.now() - mountedAt) / 60_000);
  const label =
    diffMin < 1  ? "just now" :
    diffMin === 1 ? "1 minute ago" :
    `${diffMin} minutes ago`;

  return (
    <p className="text-[11px] text-muted text-right -mt-5 mb-1">
      Last updated · {label}
    </p>
  );
}

// ─── DashboardSkeleton ────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-subtle">
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="px-4 py-3 flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
