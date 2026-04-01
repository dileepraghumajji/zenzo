"use client";

// PortalClubClient — world-class member portal
//
// Dark, bold, energetic design. Tabs: Home | Attendance | Payments | Profile.
// Hero section always visible: greeting, activity ring, stats, earned achievements.
// Achievements derived from real attendance data.
// All colours flow from semantic tokens — .dark class set by portal layout.

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Home,
  User,
  Clock,
  ChevronRight,
  Check,
  Target,
  Dumbbell,
  Zap,
  Trophy,
  Flame,
  Star,
  Sparkles,
  Medal,
  Crown,
  Award,
} from "lucide-react";
import { formatCurrency, formatDate } from "@zenzo/utils";
import type {
  MembershipStatus,
  AttendanceStatus,
  BillingCycle,
  PaymentMethod,
} from "@zenzo/database/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface AllTimeStats {
  totalPresent: number;
  maxStreak: number;
}

interface UserProfile {
  full_name: string;
  phone: string;
}

interface Achievement {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  earned: boolean;
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
  allTimeStats: AllTimeStats;
  userProfile: UserProfile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function getNextClass(batches: Batch[]): { batch: Batch; label: string } | null {
  if (!batches.length) return null;
  const todayIdx = new Date().getDay();
  for (let ahead = 0; ahead <= 7; ahead++) {
    const checkIdx = (todayIdx + ahead) % 7;
    for (const b of batches) {
      if (b.days.some((d) => (DAY_INDEX[d] ?? -1) === checkIdx)) {
        const label =
          ahead === 0
            ? "Today"
            : ahead === 1
              ? "Tomorrow"
              : (Object.keys(DAY_INDEX).find((k) => DAY_INDEX[k] === checkIdx) ?? "");
        return { batch: b, label };
      }
    }
  }
  return null;
}

function getDaysUntilDue(nextDueDate: string | null): number | null {
  if (!nextDueDate) return null;
  return Math.ceil((new Date(nextDueDate).getTime() - Date.now()) / 86400000);
}

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function getMotivationalLine(streak: number, pct: number): string {
  if (streak >= 30) return "30+ day run. Exceptional.";
  if (streak >= 14) return "Two-week streak. Keep it going.";
  if (streak >= 7) return "One week straight. You're building something real.";
  if (streak >= 3) return "Building momentum. Keep showing up.";
  if (pct >= 90) return "Outstanding attendance this month.";
  if (pct >= 70) return "Great consistency this month.";
  return "Every session counts.";
}

function computeAchievements(
  totalPresent: number,
  maxStreak: number,
  joinedAt: string,
  presentThisMonth: number,
  totalThisMonth: number
): Achievement[] {
  const now = new Date();
  const joined = new Date(joinedAt);
  const months =
    (now.getFullYear() - joined.getFullYear()) * 12 +
    now.getMonth() -
    joined.getMonth();
  const isPerfect = totalThisMonth > 0 && presentThisMonth === totalThisMonth;

  return [
    { id: "first",    label: "First Class",   desc: "Attended your first session",  icon: Target,    earned: totalPresent >= 1   },
    { id: "s10",      label: "10 Sessions",   desc: "Completed 10 classes",         icon: Dumbbell,  earned: totalPresent >= 10  },
    { id: "s50",      label: "50 Sessions",   desc: "Completed 50 classes",         icon: Zap,       earned: totalPresent >= 50  },
    { id: "s100",     label: "100 Sessions",  desc: "Completed 100 classes",        icon: Trophy,    earned: totalPresent >= 100 },
    { id: "streak7",  label: "7-Day Streak",  desc: "7 sessions in a row",          icon: Flame,     earned: maxStreak >= 7      },
    { id: "streak30", label: "30-Day Streak", desc: "30 sessions in a row",         icon: Star,      earned: maxStreak >= 30     },
    { id: "perfect",  label: "Perfect Month", desc: "All classes this month",       icon: Sparkles,  earned: isPerfect           },
    { id: "6m",       label: "6 Months",      desc: "Member for 6 months",          icon: Medal,     earned: months >= 6         },
    { id: "1y",       label: "1 Year",        desc: "Member for 1 year",            icon: Crown,     earned: months >= 12        },
  ];
}

// ─── Activity Ring ─────────────────────────────────────────────────────────────

function ActivityRing({ pct, size = 110 }: { pct: number; size?: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  const sw = 11;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(animated, 100) / 100) * circ;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   style={{ stopColor: "var(--action-primary-bg-hover)" }} />
            <stop offset="100%" style={{ stopColor: "var(--status-warning-text)" }} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          style={{ stroke: "var(--border-default)" }}
          strokeWidth={sw}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-heading">{pct}%</span>
        <span className="text-muted font-bold uppercase tracking-wider" style={{ fontSize: "9px" }}>
          Month
        </span>
      </div>
    </div>
  );
}

// ─── Status Pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  type PillConfig = { pill: string; dot: string; label: string };
  const fallback: PillConfig = { pill: "bg-surface-subtle text-muted", dot: "bg-muted", label: "Expired" };
  const map: Record<string, PillConfig> = {
    active:         { pill: "bg-success text-success-foreground",     dot: "bg-success-accent",  label: "Active"  },
    overdue:        { pill: "bg-warning text-warning-foreground",     dot: "bg-warning-accent",  label: "Overdue" },
    expired:        fallback,
    pending_invite: { pill: "bg-primary-subtle text-brand",           dot: "bg-brand",            label: "Pending" },
  };
  const c = map[status] ?? fallback;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label font-semibold ${c.pill}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Home Tab ──────────────────────────────────────────────────────────────────

function HomeTab({
  membership,
  feePlan,
  batches,
  payments,
  stats,
}: Pick<Props, "membership" | "feePlan" | "batches" | "payments" | "stats">) {
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

// ─── Attendance Tab ────────────────────────────────────────────────────────────

function AttendanceTab({
  attendanceLast90,
  stats,
}: Pick<Props, "attendanceLast90" | "stats">) {
  const dateMap = new Map(attendanceLast90.map((a) => [a.date, a.status]));

  // Generate last 90 days
  const today = new Date();
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    days.push(d.toISOString().substring(0, 10));
  }

  // This month stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .substring(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .substring(0, 10);
  const thisMonthDays = days.filter((d) => d >= monthStart && d <= monthEnd);
  const presentCount = thisMonthDays.filter((d) => dateMap.get(d) === "present").length;
  const absentCount  = thisMonthDays.filter((d) => dateMap.get(d) === "absent").length;

  // Recent sessions (last 10)
  const recentSessions = [...attendanceLast90]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: presentCount,  label: "Present", cls: "text-success-foreground" },
          { value: absentCount,   label: "Absent",  cls: "text-error-foreground"   },
          { value: stats.streak,  label: "Streak",  cls: "text-warning-foreground" },
        ].map(({ value, label, cls }) => (
          <div key={label} className="bg-surface-raised border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
            <p className="text-muted font-semibold mt-1 uppercase tracking-wide" style={{ fontSize: "10px" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-surface-raised border border-border rounded-2xl p-5">
        <p className="text-heading font-semibold mb-4">Last 90 days</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
          {days.map((d) => {
            const status = dateMap.get(d);
            const cellCls =
              status === "present"
                ? "bg-brand"
                : status === "absent"
                  ? "bg-error"
                  : "bg-surface-subtle";
            return (
              <div
                key={d}
                title={`${d}: ${status ?? "no class"}`}
                className={`aspect-square rounded-sm ${cellCls}`}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4">
          {[
            { cls: "bg-brand",         label: "Present"  },
            { cls: "bg-error",         label: "Absent"   },
            { cls: "bg-surface-subtle",label: "No class" },
          ].map(({ cls, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`inline-block size-2.5 rounded-sm ${cls}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-heading font-semibold">Recent sessions</p>
          </div>
          <div>
            {recentSessions.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <p className="text-heading text-sm">{formatDate(s.date)}</p>
                {s.status === "present" ? (
                  <span className="inline-flex items-center gap-1.5 text-label font-semibold px-2.5 py-1 rounded-full bg-success text-success-foreground">
                    <span className="size-1.5 rounded-full bg-success-accent" />
                    Present
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-label font-semibold px-2.5 py-1 rounded-full bg-error text-error-foreground">
                    <span className="size-1.5 rounded-full bg-error-accent" />
                    Absent
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payments Tab ──────────────────────────────────────────────────────────────

function PaymentsTab({
  membership,
  feePlan,
  payments,
  clubSlug,
}: Pick<Props, "membership" | "feePlan" | "payments"> & { clubSlug: string }) {
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

// ─── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({
  club,
  membership,
  feePlan,
  batches,
  userProfile,
  allTimeStats,
  achievements,
}: Pick<
  Props,
  "club" | "membership" | "feePlan" | "batches" | "userProfile" | "allTimeStats"
> & { achievements: Achievement[] }) {
  const initials = (userProfile?.full_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-surface-raised border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div
            className="size-16 rounded-2xl flex items-center justify-center text-xl font-bold text-primary-foreground shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--action-primary-bg-hover), var(--status-warning-text))",
            }}
          >
            {initials}
          </div>
          <div>
            <p className="text-heading font-bold text-xl">
              {userProfile?.full_name ?? "—"}
            </p>
            {userProfile?.phone && (
              <p className="text-muted text-sm mt-0.5">{userProfile.phone}</p>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border space-y-3">
          {[
            { label: "Member since",   value: formatDate(membership.joined_at),    cls: "text-heading" },
            { label: "Club",           value: club.name,                           cls: "text-heading" },
            ...(feePlan
              ? [{ label: "Plan",      value: `${feePlan.name} · ${formatCurrency(feePlan.amount_paise)}`, cls: "text-brand" }]
              : []),
            ...(batches.length > 0
              ? [{ label: "Batches",   value: batches.map((b) => b.name).join(", "), cls: "text-heading" }]
              : []),
            { label: "Total sessions", value: String(allTimeStats.totalPresent),      cls: "text-brand"              },
            { label: "Best streak",    value: String(allTimeStats.maxStreak),        cls: "text-warning-foreground" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-xs text-muted shrink-0">{label}</span>
              <span className={`text-sm font-medium text-right ${cls}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements grid */}
      <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="text-heading font-semibold">Achievements</p>
          <span className="text-xs text-muted">{earnedCount}/{achievements.length} earned</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-border">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`p-4 text-center ${a.earned ? "bg-surface-raised" : "bg-background"}`}
            >
              <div className="flex justify-center mb-2" style={{ opacity: a.earned ? 1 : 0.2 }}>
                <a.icon className={`size-5 ${a.earned ? "text-brand" : "text-muted"}`} />
              </div>
              <p className={`font-semibold leading-tight ${a.earned ? "text-heading" : "text-placeholder"}`} style={{ fontSize: "10px" }}>
                {a.label}
              </p>
              {a.earned && (
                <p className="text-brand font-bold uppercase tracking-wider mt-1" style={{ fontSize: "8px" }}>
                  Earned
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type Tab = "home" | "attendance" | "payments" | "profile";

export function PortalClubClient({
  club,
  membership,
  feePlan,
  batches,
  attendanceThisMonth,
  attendanceLast90,
  payments,
  stats,
  allTimeStats,
  userProfile,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const attendancePct =
    stats.totalThisMonth > 0
      ? Math.round((stats.presentThisMonth / stats.totalThisMonth) * 100)
      : 0;

  const firstName = userProfile?.full_name?.split(" ")[0] ?? "there";

  const achievements = computeAchievements(
    allTimeStats.totalPresent,
    allTimeStats.maxStreak,
    membership.joined_at,
    stats.presentThisMonth,
    stats.totalThisMonth
  );
  const earnedAchievements = achievements.filter((a) => a.earned);

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home",       label: "Home",       icon: Home       },
    { id: "attendance", label: "Attendance", icon: Calendar   },
    { id: "payments",   label: "Payments",   icon: CreditCard },
    { id: "profile",    label: "Profile",    icon: User       },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero section ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-surface-brand to-background">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-5 pb-8">
          {/* Back nav + status */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/portal"
              className="flex items-center gap-2 text-sm text-muted hover:text-heading transition-colors"
            >
              <ArrowLeft className="size-4" />
              My clubs
            </Link>
            <StatusPill status={membership.status} />
          </div>

          {/* Club name chip */}
          <p className="text-brand font-bold uppercase tracking-widest mb-1.5" style={{ fontSize: "10px" }}>
            {club.name}
          </p>

          {/* Greeting */}
          <h1 className="text-2xl lg:text-3xl font-bold text-heading mb-1">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted text-sm mb-7">
            {getMotivationalLine(stats.streak, attendancePct)}
          </p>

          {/* Activity ring + stats row */}
          <div className="flex items-center gap-6 lg:gap-12">
            <ActivityRing pct={attendancePct} size={110} />

            <div className="flex-1 grid grid-cols-3 gap-3">
              {[
                { value: stats.streak,             label: "Streak",   cls: "text-warning-foreground" },
                { value: `${attendancePct}%`,       label: "Rate",     cls: "text-brand"              },
                { value: allTimeStats.totalPresent, label: "All time", cls: "text-heading"            },
              ].map(({ value, label, cls }) => (
                <div key={label}>
                  <p className={`text-2xl lg:text-3xl font-bold ${cls}`}>{value}</p>
                  <p className="text-muted font-semibold uppercase tracking-wide mt-0.5" style={{ fontSize: "9px" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Earned achievements strip */}
          {earnedAchievements.length > 0 && (
            <div className="mt-7">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-muted font-bold uppercase tracking-widest" style={{ fontSize: "10px" }}>
                  Achievements
                </p>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="text-xs text-brand font-semibold hover:underline"
                >
                  See all →
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {earnedAchievements.map((a) => (
                  <div
                    key={a.id}
                    className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-brand border border-border"
                  >
                    <a.icon className="size-3.5 text-brand shrink-0" />
                    <span className="text-xs font-semibold text-heading whitespace-nowrap">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky tab bar ────────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 bg-surface-subtle border-b border-border backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="flex">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-5">
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
            clubSlug={club.slug}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            club={club}
            membership={membership}
            feePlan={feePlan}
            batches={batches}
            userProfile={userProfile}
            allTimeStats={allTimeStats}
            achievements={achievements}
          />
        )}
      </div>
    </div>
  );
}
