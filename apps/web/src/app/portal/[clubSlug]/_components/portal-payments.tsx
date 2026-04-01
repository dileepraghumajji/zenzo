"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@zenzo/utils";
import { type PortalClubProps, getDaysUntilDue } from "./portal-shared";

type Props = Pick<PortalClubProps, "membership" | "feePlan" | "payments"> & { clubSlug: string };

export function PortalPayments({ membership, feePlan, payments, clubSlug }: Props) {
  const daysUntilDue = getDaysUntilDue(membership.next_due_date);
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 5;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  return (
    <div className="space-y-4">
      {/* Due card */}
      <div
        className={`rounded-2xl p-6 border ${
          isOverdue
            ? "bg-error border-error-accent"
            : isUrgent
              ? "bg-warning border-warning-accent"
              : "bg-surface-raised border-border"
        }`}
      >
        <p className="text-muted font-bold uppercase tracking-widest mb-3" style={{ fontSize: "10px" }}>
          Next payment
        </p>
        {feePlan ? (
          <p className="text-3xl font-bold text-heading">{formatCurrency(feePlan.amount_paise)}</p>
        ) : (
          <p className="text-xl font-bold text-heading">—</p>
        )}
        {membership.next_due_date && (
          <p className={`text-sm mt-2 font-medium ${isOverdue ? "text-error-foreground" : isUrgent ? "text-warning-foreground" : "text-muted"}`}>
            {isOverdue
              ? `${Math.abs(daysUntilDue!)} days overdue`
              : daysUntilDue === 0
                ? "Due today"
                : `Due in ${daysUntilDue} days · ${formatDate(membership.next_due_date)}`}
          </p>
        )}
        {feePlan && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-subtle text-brand">
            {feePlan.name} · {feePlan.billing_cycle}
          </div>
        )}
        <p className="text-xs text-placeholder mt-3">Pay your coach directly</p>
      </div>

      {/* Payment history */}
      <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-heading font-semibold">Payment history</p>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted text-sm">
            No payments recorded yet
          </div>
        ) : (
          <div>
            {payments.map((p, i) => (
              <Link
                key={p.id}
                href={`/portal/${clubSlug}/payments/${p.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-surface-subtle transition-colors ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-success flex items-center justify-center">
                    <Check className="size-4 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-heading font-semibold">
                      {formatCurrency(p.amount_paise)}
                    </p>
                    <p className="text-muted text-xs">
                      {formatDate(p.payment_date)} · {p.method.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-placeholder" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
