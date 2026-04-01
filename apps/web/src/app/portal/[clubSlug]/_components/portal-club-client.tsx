"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Calendar, CreditCard, User } from "lucide-react";
import {
  type PortalClubProps,
  ActivityRing,
  StatusPill,
  getGreeting,
  getMotivationalLine,
  computeAchievements,
} from "./portal-shared";
import { PortalHome } from "./portal-home";
import { PortalAttendance } from "./portal-attendance";
import { PortalPayments } from "./portal-payments";
import { PortalProfile } from "./portal-profile";

type Tab = "home" | "attendance" | "payments" | "profile";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home",       label: "Home",       icon: Home       },
  { id: "attendance", label: "Attendance", icon: Calendar   },
  { id: "payments",   label: "Payments",   icon: CreditCard },
  { id: "profile",    label: "Profile",    icon: User       },
];

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
}: PortalClubProps) {
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

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-surface-brand to-background">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-5 pb-8">
          {/* Back + status */}
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

          {/* Club chip */}
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

          {/* Ring + stats */}
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

      {/* ── Sticky tab bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 bg-surface-subtle border-b border-border backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === id ? "border-brand text-brand" : "border-transparent text-muted"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-5">
        {activeTab === "home" && (
          <PortalHome
            membership={membership}
            feePlan={feePlan}
            batches={batches}
            payments={payments}
            stats={stats}
          />
        )}
        {activeTab === "attendance" && (
          <PortalAttendance attendanceLast90={attendanceLast90} stats={stats} />
        )}
        {activeTab === "payments" && (
          <PortalPayments
            membership={membership}
            feePlan={feePlan}
            payments={payments}
            clubSlug={club.slug}
          />
        )}
        {activeTab === "profile" && (
          <PortalProfile
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
