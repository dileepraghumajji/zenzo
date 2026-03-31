"use client";

// PortalClubClient — tabs: Home | Attendance | Payments
// Member-facing view of one club. Read-only Phase 1.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, CreditCard, Home } from "lucide-react";
import { formatCurrency, formatDate } from "@zenzo/utils";
import type { MembershipStatus, AttendanceStatus, BillingCycle, PaymentMethod } from "@zenzo/database/enums";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Club {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
}

interface Membership {
  id: string;
  status: MembershipStatus;
  joined_at: string;
  next_due_date: string | null;
}

interface FeePlan {
  id: string;
  name: string;
  amount_paise: number;
  billing_cycle: BillingCycle;
}

interface Batch {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  days: string[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  batch_id: string;
}

interface Payment {
  id: string;
  amount_paise: number;
  method: PaymentMethod;
  payment_date: string;
  reference: string | null;
  note: string | null;
}

interface Stats {
  presentThisMonth: number;
  totalThisMonth: number;
  streak: number;
}

interface Props {
  club: Club;
  membership: Membership;
  feePlan: FeePlan | null;
  batches: Batch[];
  attendanceThisMonth: AttendanceRecord[];
  attendanceLast90: AttendanceRecord[];
  payments: Payment[];
  stats: Stats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success-subtle text-success-foreground",
    overdue: "bg-warning-subtle text-warning-foreground",
    expired: "bg-surface-subtle text-muted",
    pending_invite: "bg-primary-subtle text-brand",
  };
  const labels: Record<string, string> = {
    active: "Active",
    overdue: "Overdue",
    expired: "Expired",
    pending_invite: "Pending",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-caption font-medium ${
        styles[status] ?? "bg-surface-subtle text-muted"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatTime(t: string) {
  const parts = t.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// ─── Home Tab ────────────────────────────────────────────────────────────────

function HomeTab({
  membership,
  feePlan,
  batches,
  payments,
  stats,
}: Pick<Props, "membership" | "feePlan" | "batches" | "payments" | "stats">) {
  const attendancePct =
    stats.totalThisMonth > 0
      ? Math.round((stats.presentThisMonth / stats.totalThisMonth) * 100)
      : 0;
  const lastPayment = payments[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Attendance this month */}
      <div className="bg-surface-raised border border-border rounded-xl p-5">
        <p className="text-caption text-muted mb-1">Attendance this month</p>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-h1 font-bold text-heading">{stats.presentThisMonth}</span>
          <span className="text-body text-muted mb-1">/ {stats.totalThisMonth} sessions</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div
            className="bg-brand rounded-full h-2 transition-all"
            style={{ width: `${attendancePct}%` }}
          />
        </div>
        <p className="text-caption text-muted mt-1.5">{attendancePct}% attendance rate</p>
      </div>

      {/* Fee info */}
      <div className="bg-surface-raised border border-border rounded-xl p-5">
        <p className="text-caption text-muted mb-1">Next payment due</p>
        {membership.next_due_date ? (
          <p className="text-h3 font-semibold text-heading">
            {formatDate(membership.next_due_date)}
          </p>
        ) : (
          <p className="text-body text-muted">No due date set</p>
        )}
        {feePlan && (
          <p className="text-body text-brand font-medium mt-0.5">
            {formatCurrency(feePlan.amount_paise)} · {feePlan.name}
          </p>
        )}
        <p className="text-caption text-muted mt-2">Pay your coach directly</p>
      </div>

      {/* Last payment */}
      {lastPayment && (
        <div className="bg-surface-raised border border-border rounded-xl p-5">
          <p className="text-caption text-muted mb-1">Last payment</p>
          <p className="text-h3 font-semibold text-heading">
            {formatCurrency(lastPayment.amount_paise)}
          </p>
          <p className="text-caption text-muted mt-0.5">
            {formatDate(lastPayment.payment_date)} · {lastPayment.method.replace(/_/g, " ")}
          </p>
        </div>
      )}

      {/* Batch schedule */}
      {batches.length > 0 && (
        <div className="bg-surface-raised border border-border rounded-xl p-5">
          <p className="text-caption text-muted mb-3">Your schedule</p>
          <div className="space-y-3">
            {batches.map((b) => (
              <div key={b.id}>
                <p className="text-body font-medium text-heading">{b.name}</p>
                <p className="text-caption text-muted">
                  {b.days.map((d) => DAY_SHORT[d] ?? d).join(", ")} ·{" "}
                  {formatTime(b.start_time)} – {formatTime(b.end_time)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────

function AttendanceTab({
  attendanceLast90,
  stats,
}: Pick<Props, "attendanceLast90" | "stats">) {
  // Build a map of date → status for heatmap
  const dateMap = new Map(attendanceLast90.map((a) => [a.date, a.status]));

  // Generate last 90 days
  const days: string[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().substring(0, 10));
  }

  // Monthly summary
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .substring(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .substring(0, 10);
  const thisMonthDays = days.filter((d) => d >= monthStart && d <= monthEnd);
  const presentCount = thisMonthDays.filter((d) => dateMap.get(d) === "present").length;
  const absentCount = thisMonthDays.filter((d) => dateMap.get(d) === "absent").length;

  return (
    <div className="space-y-4">
      {/* Monthly summary */}
      <div className="bg-surface-raised border border-border rounded-xl p-5">
        <p className="text-caption text-muted mb-3">This month</p>
        <div className="flex gap-6">
          <div>
            <p className="text-h2 font-bold text-success-foreground">{presentCount}</p>
            <p className="text-caption text-muted">Present</p>
          </div>
          <div>
            <p className="text-h2 font-bold text-error-foreground">{absentCount}</p>
            <p className="text-caption text-muted">Absent</p>
          </div>
          <div>
            <p className="text-h2 font-bold text-heading">{stats.streak}</p>
            <p className="text-caption text-muted">Streak</p>
          </div>
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className="bg-surface-raised border border-border rounded-xl p-5">
        <p className="text-caption text-muted mb-3">Last 90 days</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(13, 1fr)" }}>
          {days.map((d) => {
            const status = dateMap.get(d);
            let bg = "bg-border"; // no class / not marked
            if (status === "present") bg = "bg-success";
            else if (status === "absent") bg = "bg-error-subtle";
            return (
              <div
                key={d}
                title={`${d}: ${status ?? "no class"}`}
                className={`aspect-square rounded-sm ${bg}`}
              />
            );
          })}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-caption text-muted">
            <span className="inline-block size-2.5 rounded-sm bg-success" /> Present
          </span>
          <span className="flex items-center gap-1.5 text-caption text-muted">
            <span className="inline-block size-2.5 rounded-sm bg-error-subtle" /> Absent
          </span>
          <span className="flex items-center gap-1.5 text-caption text-muted">
            <span className="inline-block size-2.5 rounded-sm bg-border" /> No class
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab({
  membership,
  feePlan,
  payments,
  clubSlug,
}: Pick<Props, "membership" | "feePlan" | "payments" | "club"> & { clubSlug: string }) {
  return (
    <div className="space-y-4">
      {/* Next due */}
      <div className="bg-surface-raised border border-border rounded-xl p-5">
        <p className="text-caption text-muted mb-1">Next payment due</p>
        {membership.next_due_date ? (
          <p className="text-h3 font-semibold text-heading">
            {formatDate(membership.next_due_date)}
          </p>
        ) : (
          <p className="text-body text-muted">No due date set</p>
        )}
        {feePlan && (
          <p className="text-caption text-muted mt-0.5">
            {formatCurrency(feePlan.amount_paise)} · {feePlan.name}
          </p>
        )}
        <p className="text-caption text-muted mt-2">Pay your coach directly</p>
      </div>

      {/* Payment history */}
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-body font-semibold text-heading">Payment history</p>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted text-caption">
            No payments recorded yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((p) => (
              <Link
                key={p.id}
                href={`/portal/${clubSlug}/payments/${p.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface-subtle transition-colors"
              >
                <div>
                  <p className="text-body font-medium text-heading">
                    {formatCurrency(p.amount_paise)}
                  </p>
                  <p className="text-caption text-muted">
                    {formatDate(p.payment_date)} · {p.method.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="text-caption text-brand">View →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function PortalClubClient({
  club,
  membership,
  feePlan,
  batches,
  attendanceThisMonth,
  attendanceLast90,
  payments,
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState<"home" | "attendance" | "payments">("home");

  return (
    <div className="space-y-4">
      {/* Club header */}
      <div className="flex items-center gap-3">
        <Link href="/portal" className="text-muted hover:text-heading transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-h2 font-bold text-heading truncate">{club.name}</h1>
          <StatusBadge status={membership.status} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {(
          [
            { id: "home", label: "Home", icon: Home },
            { id: "attendance", label: "Attendance", icon: Calendar },
            { id: "payments", label: "Payments", icon: CreditCard },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-caption font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-heading"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "home" && (
        <HomeTab
          membership={membership}
          feePlan={feePlan}
          batches={batches}
          payments={payments}
          stats={stats}
        />
      )}
      {activeTab === "attendance" && (
        <AttendanceTab attendanceLast90={attendanceLast90} stats={stats} />
      )}
      {activeTab === "payments" && (
        <PaymentsTab
          membership={membership}
          feePlan={feePlan}
          payments={payments}
          club={club}
          clubSlug={club.slug}
        />
      )}
    </div>
  );
}
