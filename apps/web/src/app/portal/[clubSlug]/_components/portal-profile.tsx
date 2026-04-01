"use client";

import { formatCurrency, formatDate } from "@zenzo/utils";
import { type PortalClubProps, type Achievement } from "./portal-shared";

type Props = Pick<PortalClubProps, "club" | "membership" | "feePlan" | "batches" | "userProfile" | "allTimeStats"> & {
  achievements: Achievement[];
};

export function PortalProfile({ club, membership, feePlan, batches, userProfile, allTimeStats, achievements }: Props) {
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
              ? [{ label: "Plan", value: `${feePlan.name} · ${formatCurrency(feePlan.amount_paise)}`, cls: "text-brand" }]
              : []),
            ...(batches.length > 0
              ? [{ label: "Batches", value: batches.map((b) => b.name).join(", "), cls: "text-heading" }]
              : []),
            { label: "Total sessions", value: String(allTimeStats.totalPresent), cls: "text-brand"              },
            { label: "Best streak",    value: String(allTimeStats.maxStreak),    cls: "text-warning-foreground" },
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
              <p
                className={`font-semibold leading-tight ${a.earned ? "text-heading" : "text-placeholder"}`}
                style={{ fontSize: "10px" }}
              >
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
