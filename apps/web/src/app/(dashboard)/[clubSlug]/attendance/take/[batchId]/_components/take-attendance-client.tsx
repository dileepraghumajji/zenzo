"use client";

// ─── TakeAttendanceClient ──────────────────────────────────────────────────────
//
// Bulk present/absent toggle for all members in a batch.
// Submits via POST /api/attendance/[batchId].
// Navigate-away guard fires when statuses have been modified but not saved.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Users, UserPlus } from "lucide-react";
import {
  Avatar, Badge, Button, Dialog, DialogContent, DialogFooter, DialogClose,
  FormField, Input, cn,
} from "@zenzo/ui";
import { AttendanceStatus } from "@zenzo/database/enums";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BatchMember {
  membershipId: string;
  userId: string;
  fullName: string;
  phone: string;
  existingStatus: AttendanceStatus | null;
  isDropIn?: boolean;
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
  members: initialMembers,
}: TakeAttendanceClientProps) {
  const router = useRouter();

  // Initialise from any pre-existing records
  const [members, setMembers] = React.useState<BatchMember[]>(initialMembers);
  const [statuses, setStatuses] = React.useState<StatusMap>(() => {
    const init: StatusMap = {};
    for (const m of initialMembers) {
      if (m.existingStatus) init[m.membershipId] = m.existingStatus;
    }
    return init;
  });

  // Track initial state to detect unsaved changes
  const initialStatuses = React.useRef<StatusMap>(
    initialMembers.reduce((acc, m) => {
      if (m.existingStatus) acc[m.membershipId] = m.existingStatus;
      return acc;
    }, {} as StatusMap)
  );

  const hasUnsavedChanges = React.useMemo(() => {
    const keys = new Set([
      ...Object.keys(statuses),
      ...Object.keys(initialStatuses.current),
    ]);
    for (const k of keys) {
      if (statuses[k] !== (initialStatuses.current as StatusMap)[k]) return true;
    }
    return false;
  }, [statuses]);

  // Navigate-away guard
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showDropInDialog, setShowDropInDialog] = React.useState(false);
  const [dropInPhone, setDropInPhone] = React.useState("");
  const [dropInSearching, setDropInSearching] = React.useState(false);
  const [dropInError, setDropInError] = React.useState("");

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

  // Search for a non-batch club member by phone to add as drop-in
  const handleDropInSearch = async () => {
    const phone = dropInPhone.trim();
    if (phone.length !== 10) {
      setDropInError("Enter a valid 10-digit phone number.");
      return;
    }
    setDropInSearching(true);
    setDropInError("");
    try {
      const res = await fetch(
        `/api/attendance/${batchId}/drop-in?phone=${phone}&clubSlug=${clubSlug}&date=${date}`
      );
      const data = await res.json();
      if (!res.ok) {
        setDropInError(data.error ?? "Member not found.");
        return;
      }
      // Add to members list if not already there
      setMembers((prev) => {
        if (prev.some((m) => m.membershipId === data.membershipId)) return prev;
        return [...prev, {
          membershipId: data.membershipId,
          userId:       data.userId,
          fullName:     data.fullName,
          phone:        data.phone,
          existingStatus: null,
          isDropIn: true,
        }];
      });
      setStatuses((prev) => ({ ...prev, [data.membershipId]: AttendanceStatus.Present }));
      setDropInPhone("");
      setShowDropInDialog(false);
    } catch {
      setDropInError("Network error.");
    } finally {
      setDropInSearching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const records = members.map((m) => ({
        membership_id: m.membershipId,
        status: statuses[m.membershipId] ?? AttendanceStatus.Unmarked,
        is_drop_in: m.isDropIn ?? false,
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
      <div className="flex gap-2 flex-wrap">
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
        <Button
          variant="ghost"
          size="sm"
          icon={<UserPlus className="size-3.5" />}
          onClick={() => setShowDropInDialog(true)}
        >
          Add Drop-in
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
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-foreground">
                        {m.fullName}
                      </p>
                      {m.isDropIn && (
                        <Badge variant="info" label="Drop-in" size="sm" />
                      )}
                    </div>
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

      {/* ── Drop-in dialog ───────────────────────────────────────────────────── */}
      <Dialog open={showDropInDialog} onOpenChange={(v) => {
        setShowDropInDialog(v);
        setDropInPhone("");
        setDropInError("");
      }}>
        <DialogContent title="Add Drop-in">
          <div className="space-y-4 py-2">
            <p className="text-[13px] text-muted">
              Search for a club member by phone number to mark as a drop-in for today&apos;s session.
            </p>
            <FormField label="Phone Number" htmlFor="dropInPhone">
              <Input
                id="dropInPhone"
                type="tel"
                value={dropInPhone}
                onChange={(e) => setDropInPhone(e.target.value)}
                placeholder="10-digit mobile"
                maxLength={10}
              />
            </FormField>
            {dropInError && (
              <p className="text-[13px] text-error-foreground">{dropInError}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              disabled={dropInSearching || dropInPhone.length !== 10}
              onClick={handleDropInSearch}
            >
              {dropInSearching ? "Searching..." : "Add Drop-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
