"use client";

import { Calendar, CreditCard, Clock, Check } from "lucide-react";
import { formatCurrency, formatDate } from "@zenzo/utils";
import {
  type PortalClubProps,
  DAY_SHORT,
  getNextClass,
  getDaysUntilDue,
  formatTime,
} from "./portal-shared";

type Props = Pick<PortalClubProps, "membership" | "feePlan" | "batches" | "payments" | "stats">;

export function PortalHome({ membership, feePlan, batches, payments, stats }: Props) {
  const nextClass = getNextClass(batches);
  const daysUntilDue = getDaysUntilDue(membership.next_due_date);
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 5;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const attendancePct =
    stats.totalThisMonth > 0
      ? Math.round((stats.presentThisMonth / stats.totalThisMonth) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Quick cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Next class */}
        <div className="bg-surface-raised border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-muted mb-3" style={{ fontSize: "11px", fontWeight: 600 }}>
            <Calendar className="size-3.5" />
            NEXT CLASS
          </div>
          {nextClass ? (
            <>
              <p className="text-heading font-semibold text-sm truncate">{nextClass.batch.name}</p>
              <p className={`text-xs mt-1 font-medium ${nextClass.label === "Today" ? "text-success-foreground" : "text-muted"}`}>
                {nextClass.label} · {formatTime(nextClass.batch.start_time)}
              </p>
            </>
          ) : (
            <p className="text-muted text-sm">No upcoming</p>
          )}
        </div>

        {/* Payment due */}
        <div
          className={`rounded-2xl p-4 border ${
            isOverdue
              ? "bg-error border-error-accent"
              : isUrgent
                ? "bg-warning border-warning-accent"
                : "bg-surface-raised border-border"
          }`}
        >
          <div className="flex items-center gap-1.5 text-muted mb-3" style={{ fontSize: "11px", fontWeight: 600 }}>
            <CreditCard className="size-3.5" />
            PAYMENT
          </div>
          {membership.next_due_date ? (
            <>
              {feePlan && (
                <p className="text-heading font-semibold text-sm">
                  {formatCurrency(feePlan.amount_paise)}
                </p>
              )}
              <p className={`text-xs mt-1 font-medium ${isOverdue ? "text-error-foreground" : isUrgent ? "text-warning-foreground" : "text-muted"}`}>
                {isOverdue
                  ? `${Math.abs(daysUntilDue!)} days overdue`
                  : daysUntilDue === 0
                    ? "Due today"
                    : `Due in ${daysUntilDue} days`}
              </p>
            </>
          ) : (
            <p className="text-muted text-sm">No due date</p>
          )}
        </div>
      </div>

      {/* Month progress */}
      <div className="bg-surface-raised border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-heading font-semibold">This month</p>
          <p className="text-sm text-muted">
            {stats.presentThisMonth} / {stats.totalThisMonth} sessions
          </p>
        </div>
        <div className="w-full bg-border rounded-full overflow-hidden" style={{ height: "10px" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${attendancePct}%`,
              background: "linear-gradient(90deg, var(--action-primary-bg-hover), var(--status-warning-text))",
              transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
        <p className="text-xs text-muted mt-2">{attendancePct}% attendance rate</p>
      </div>

      {/* Schedule */}
      {batches.length > 0 && (
        <div className="bg-surface-raised border border-border rounded-2xl p-5">
          <p className="text-heading font-semibold mb-4">Your schedule</p>
          <div className="space-y-3">
            {batches.map((b) => (
              <div key={b.id} className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
                  <Clock className="size-3.5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-heading font-medium text-sm">{b.name}</p>
                  <p className="text-muted text-xs">
                    {b.days.map((d) => DAY_SHORT[d] ?? d).join(", ")} ·{" "}
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last payment */}
      {payments.length > 0 && (
        <div className="bg-surface-raised border border-border rounded-2xl p-5">
          <p className="text-heading font-semibold mb-3">Last payment</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-heading">
                {formatCurrency(payments[0]!.amount_paise)}
              </p>
              <p className="text-muted text-xs mt-0.5">
                {formatDate(payments[0]!.payment_date)} ·{" "}
                {payments[0]!.method.replace(/_/g, " ")}
              </p>
            </div>
            <div className="size-10 rounded-full bg-success flex items-center justify-center">
              <Check className="size-5 text-success-foreground" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
