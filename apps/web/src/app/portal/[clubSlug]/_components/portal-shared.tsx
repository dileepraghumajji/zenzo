"use client";

// portal-shared.tsx
// Shared types, helpers, and small UI components for the portal club page.

import { useState, useEffect } from "react";
import {
  Target, Dumbbell, Zap, Trophy, Flame, Star, Sparkles, Medal, Crown,
} from "lucide-react";
import type { MembershipStatus, AttendanceStatus, BillingCycle, PaymentMethod } from "@zenzo/database/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
}

export interface Membership {
  id: string;
  status: MembershipStatus;
  joined_at: string;
  next_due_date: string | null;
}

export interface FeePlan {
  id: string;
  name: string;
  amount_paise: number;
  billing_cycle: BillingCycle;
}

export interface Batch {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  days: string[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  batch_id: string;
}

export interface Payment {
  id: string;
  amount_paise: number;
  method: PaymentMethod;
  payment_date: string;
  reference: string | null;
  note: string | null;
}

export interface Stats {
  presentThisMonth: number;
  totalThisMonth: number;
  streak: number;
}

export interface AllTimeStats {
  totalPresent: number;
  maxStreak: number;
}

export interface UserProfile {
  full_name: string;
  phone: string;
}

export interface Achievement {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  earned: boolean;
}

export interface PortalClubProps {
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

export function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

export function getNextClass(batches: Batch[]): { batch: Batch; label: string } | null {
  if (!batches.length) return null;
  const todayIdx = new Date().getDay();
  for (let ahead = 0; ahead <= 7; ahead++) {
    const checkIdx = (todayIdx + ahead) % 7;
    for (const b of batches) {
      if (b.days.some((d) => (DAY_INDEX[d] ?? -1) === checkIdx)) {
        const label =
          ahead === 0 ? "Today"
          : ahead === 1 ? "Tomorrow"
          : (Object.keys(DAY_INDEX).find((k) => DAY_INDEX[k] === checkIdx) ?? "");
        return { batch: b, label };
      }
    }
  }
  return null;
}

export function getDaysUntilDue(nextDueDate: string | null): number | null {
  if (!nextDueDate) return null;
  return Math.ceil((new Date(nextDueDate).getTime() - Date.now()) / 86400000);
}

export function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function getMotivationalLine(streak: number, pct: number): string {
  if (streak >= 30) return "30+ day run. Exceptional.";
  if (streak >= 14) return "Two-week streak. Keep it going.";
  if (streak >= 7) return "One week straight. You're building something real.";
  if (streak >= 3) return "Building momentum. Keep showing up.";
  if (pct >= 90) return "Outstanding attendance this month.";
  if (pct >= 70) return "Great consistency this month.";
  return "Every session counts.";
}

export function computeAchievements(
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
    now.getMonth() - joined.getMonth();
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

// ─── ActivityRing ─────────────────────────────────────────────────────────────

export function ActivityRing({ pct, size = 110 }: { pct: number; size?: number }) {
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
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          style={{ stroke: "var(--border-default)" }}
          strokeWidth={sw}
        />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-heading">{pct}%</span>
        <span className="text-muted font-bold uppercase tracking-wider" style={{ fontSize: "9px" }}>
          Month
        </span>
      </div>
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

export function StatusPill({ status }: { status: string }) {
  type PillConfig = { pill: string; dot: string; label: string };
  const fallback: PillConfig = { pill: "bg-surface-subtle text-muted", dot: "bg-muted", label: "Expired" };
  const map: Record<string, PillConfig> = {
    active:         { pill: "bg-success text-success-foreground",  dot: "bg-success-accent", label: "Active"  },
    overdue:        { pill: "bg-warning text-warning-foreground",  dot: "bg-warning-accent", label: "Overdue" },
    expired:        fallback,
    pending_invite: { pill: "bg-primary-subtle text-brand",        dot: "bg-brand",          label: "Pending" },
  };
  const c = map[status] ?? fallback;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label font-semibold ${c.pill}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
