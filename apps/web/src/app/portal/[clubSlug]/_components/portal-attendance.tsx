"use client";

import { formatDate } from "@zenzo/utils";
import { type PortalClubProps } from "./portal-shared";

type Props = Pick<PortalClubProps, "attendanceLast90" | "stats">;

export function PortalAttendance({ attendanceLast90, stats }: Props) {
  const dateMap = new Map(attendanceLast90.map((a) => [a.date, a.status]));

  const today = new Date();
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    days.push(d.toISOString().substring(0, 10));
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substring(0, 10);
  const thisMonthDays = days.filter((d) => d >= monthStart && d <= monthEnd);
  const presentCount = thisMonthDays.filter((d) => dateMap.get(d) === "present").length;
  const absentCount  = thisMonthDays.filter((d) => dateMap.get(d) === "absent").length;

  const recentSessions = [...attendanceLast90]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: presentCount, label: "Present", cls: "text-success-foreground" },
          { value: absentCount,  label: "Absent",  cls: "text-error-foreground"   },
          { value: stats.streak, label: "Streak",  cls: "text-warning-foreground" },
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
              status === "present" ? "bg-brand"
              : status === "absent" ? "bg-error"
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
        <div className="flex items-center gap-4 mt-4">
          {[
            { cls: "bg-brand",          label: "Present"  },
            { cls: "bg-error",          label: "Absent"   },
            { cls: "bg-surface-subtle", label: "No class" },
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
