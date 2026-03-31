"use client";

// ─── PaymentsClient ────────────────────────────────────────────────────────────
//
// Two tabs:
//   Overdue  — members whose next_due_date has passed (status: overdue | expired)
//   History  — all payments recorded for this club, newest first

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  cn,
} from "@zenzo/ui";
import { formatCurrency, formatDate } from "@zenzo/utils";
import { MembershipStatus, PaymentMethod } from "@zenzo/database/enums";
import { RecordPaymentModal } from "../../members/[memberId]/_components/record-payment-modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OverdueMember {
  membershipId: string;
  userId: string;
  fullName: string;
  phone: string;
  status: MembershipStatus;
  nextDueDate: string | null;
  planName: string | null;
  planAmountPaise: number | null;
  daysOverdue: number;
}

export interface PaymentRecord {
  id: string;
  amountPaise: number;
  method: PaymentMethod;
  date: string;
  memberName: string;
  memberUserId: string;
  note: string | null;
}

interface PaymentsClientProps {
  clubSlug: string;
  overdueMembers: OverdueMember[];
  paymentHistory: PaymentRecord[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PaymentsClient({
  clubSlug,
  overdueMembers,
  paymentHistory,
}: PaymentsClientProps) {
  const router = useRouter();
  const [recordingFor, setRecordingFor] = React.useState<OverdueMember | null>(
    null
  );

  return (
    <>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-[26px] font-bold text-foreground">Payments</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Track dues and payment history.
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overdue">
          <TabsList>
            <TabsTrigger value="overdue">
              Overdue
              {overdueMembers.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-error text-white text-[10px] font-bold w-4 h-4">
                  {overdueMembers.length > 99 ? "99+" : overdueMembers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* ── Overdue tab ────────────────────────────────────────────── */}
          <TabsContent value="overdue" className="mt-6">
            {overdueMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-success-subtle flex items-center justify-center mb-4">
                  <CreditCard className="size-7 text-success-foreground" />
                </div>
                <p className="text-[15px] font-semibold text-foreground mb-1">
                  All payments up to date
                </p>
                <p className="text-[13px] text-muted">
                  No overdue members at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop table */}
                <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-subtle border-b border-border">
                        <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">
                          Member
                        </th>
                        <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">
                          Plan
                        </th>
                        <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">
                          Due Date
                        </th>
                        <th className="text-right px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {overdueMembers.map((m) => (
                        <tr
                          key={m.membershipId}
                          className="hover:bg-surface-subtle transition-colors duration-100"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={m.fullName} size="sm" />
                              <div>
                                <Link
                                  href={`/${clubSlug}/members/${m.userId}`}
                                  className="text-[13px] font-medium text-foreground hover:underline"
                                >
                                  {m.fullName}
                                </Link>
                                <p className="text-[12px] text-muted font-mono">
                                  {m.phone}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[13px] text-foreground">
                              {m.planName ?? "—"}
                            </p>
                            {m.planAmountPaise != null && (
                              <p className="text-[12px] text-muted font-mono">
                                {formatCurrency(m.planAmountPaise)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {m.nextDueDate ? (
                              <div>
                                <p className="text-[13px] text-error-foreground font-medium">
                                  {formatDate(m.nextDueDate)}
                                </p>
                                <p className="text-[12px] text-muted">
                                  {m.daysOverdue}d overdue
                                </p>
                              </div>
                            ) : (
                              <Badge
                                variant="error"
                                label={m.status === MembershipStatus.Expired ? "Expired" : "Overdue"}
                                size="sm"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setRecordingFor(m)}
                            >
                              Record Payment
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {overdueMembers.map((m) => (
                    <div
                      key={m.membershipId}
                      className="rounded-xl border border-border bg-background p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.fullName} size="sm" />
                          <div>
                            <Link
                              href={`/${clubSlug}/members/${m.userId}`}
                              className="text-[14px] font-semibold text-foreground"
                            >
                              {m.fullName}
                            </Link>
                            <p className="text-[12px] text-muted font-mono">
                              {m.phone}
                            </p>
                          </div>
                        </div>
                        {m.nextDueDate && (
                          <div className="text-right shrink-0">
                            <p className="text-[12px] text-error-foreground font-medium">
                              {m.daysOverdue}d overdue
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-[13px] text-muted">
                          {m.planName ?? "No plan"}{" "}
                          {m.planAmountPaise != null && (
                            <span className="font-mono">
                              · {formatCurrency(m.planAmountPaise)}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRecordingFor(m)}
                        >
                          Record
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── History tab ────────────────────────────────────────────── */}
          <TabsContent value="history" className="mt-6">
            {paymentHistory.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[14px] text-muted">
                  No payment history yet.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-subtle border-b border-border">
                      <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">
                        Member
                      </th>
                      <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em] hidden sm:table-cell">
                        Method
                      </th>
                      <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">
                        Date
                      </th>
                      <th className="text-right px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentHistory.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-surface-subtle transition-colors duration-100"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/${clubSlug}/members/${p.memberUserId}`}
                            className="text-[13px] font-medium text-foreground hover:underline"
                          >
                            {p.memberName}
                          </Link>
                          {p.note && (
                            <p className="text-[12px] text-muted">{p.note}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-[13px] text-muted capitalize">
                            {p.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted">
                          {formatDate(p.date)}
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] font-mono font-medium text-foreground">
                          {formatCurrency(p.amountPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Record Payment Modal ───────────────────────────────────────────── */}
      {recordingFor && (
        <RecordPaymentModal
          clubSlug={clubSlug}
          member={recordingFor}
          onClose={() => setRecordingFor(null)}
          onSuccess={() => {
            setRecordingFor(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
