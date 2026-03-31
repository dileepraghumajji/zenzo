"use client";

// ─── TakeAttendanceClient ──────────────────────────────────────────────────────
//
// Bulk present/absent toggle for all members in a batch.
// Submits via POST /api/attendance/[batchId].

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Users } from "lucide-react";
import { Avatar, Badge, Button, cn } from "@zenzo/ui";
import { AttendanceStatus } from "@zenzo/database/enums";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BatchMember {
  membershipId: string;
  userId: string;
  fullName: string;
  phone: string;
  existingStatus: AttendanceStatus | null;
}

interface TakeAttendanceClientProps {
  clubSlug: string;
  batchId: string;
  batchName: string;
  date: string; // YYYY-MM-DD
  members: BatchMember[];
}

type StatusMap = Record<string, AttendanceStatus>;

// ─── Component ─────────────────────────────────────────────────────────────────

export function TakeAttendanceClient({
  clubSlug,
  batchId,
  batchName,
  date,
  members,
}: TakeAttendanceClientProps) {
  const router = useRouter();

  // Initialise from any pre-existing records
  const [statuses, setStatuses] = React.useState<StatusMap>(() => {
    const init: StatusMap = {};
    for (const m of members) {
      if (m.existingStatus) init[m.membershipId] = m.existingStatus;
    }
    return init;
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const toggle = (membershipId: string) => {
    setStatuses((prev) => {
      const current = prev[membershipId];
      if (current === AttendanceStatus.Present) {
        return { ...prev, [membershipId]: AttendanceStatus.Absent };
      }
      return { ...prev, [membershipId]: AttendanceStatus.Present };
    });
  };

  const markAll = (status: AttendanceStatus) => {
    const next: StatusMap = {};
    for (const m of members) next[m.membershipId] = status;
    setStatuses(next);
  };

  const presentCount = Object.values(statuses).filter(
    (s) => s === AttendanceStatus.Present
  ).length;

  const absentCount = Object.values(statuses).filter(
    (s) => s === AttendanceStatus.Absent
  ).length;

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const records = members.map((m) => ({
        membership_id: m.membershipId,
        status: statuses[m.membershipId] ?? AttendanceStatus.Unmarked,
      }));

      const res = await fetch(`/api/attendance/${batchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubSlug, date, records }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save attendance");
        return;
      }

      router.push(`/${clubSlug}/attendance/history`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground">{batchName}</h1>
        <p className="text-[13px] text-muted mt-0.5">
          {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── Summary chips ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[13px] text-muted">
          <Users className="size-4" />
          <span>{members.length} members</span>
        </div>
        <Badge variant="success" label={`${presentCount} Present`} size="sm" />
        <Badge variant="neutral" label={`${absentCount} Absent`} size="sm" />
        {members.length - presentCount - absentCount > 0 && (
          <Badge
            variant="info"
            label={`${members.length - presentCount - absentCount} Unmarked`}
            size="sm"
          />
        )}
      </div>

      {/* ── Bulk actions ────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => markAll(AttendanceStatus.Present)}
        >
          Mark All Present
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAll(AttendanceStatus.Absent)}
        >
          Mark All Absent
        </Button>
      </div>

      {/* ── Member list ─────────────────────────────────────────────────────── */}
      {members.length === 0 ? (
        <div className="text-center py-16 text-[14px] text-muted">
          No members in this batch yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {members.map((m) => {
            const status = statuses[m.membershipId];
            const isPresent = status === AttendanceStatus.Present;
            const isAbsent = status === AttendanceStatus.Absent;

            return (
              <div
                key={m.membershipId}
                className={cn(
                  "flex items-center justify-between px-4 py-3 transition-colors duration-100",
                  isPresent && "bg-success-subtle",
                  isAbsent && "bg-error-subtle"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.fullName} size="sm" />
                  <div>
                    <p className="text-[14px] font-medium text-foreground">
                      {m.fullName}
                    </p>
                    <p className="text-[12px] text-muted font-mono">
                      {m.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggle(m.membershipId)}
                  className={cn(
                    "size-9 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                    isPresent &&
                      "border-success bg-success text-white",
                    isAbsent &&
                      "border-error bg-error text-white",
                    !isPresent &&
                      !isAbsent &&
                      "border-border bg-background text-muted hover:border-primary"
                  )}
                  aria-label={`Toggle ${m.fullName}`}
                >
                  {isPresent && <Check className="size-4" strokeWidth={2.5} />}
                  {isAbsent && <X className="size-4" strokeWidth={2.5} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-[13px] text-error-foreground font-medium">{error}</p>
      )}

      {/* ── Save footer ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={isSaving || members.length === 0}
          onClick={handleSave}
        >
          {isSaving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
}
