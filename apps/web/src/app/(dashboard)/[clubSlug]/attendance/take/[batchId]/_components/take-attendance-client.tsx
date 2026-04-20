"use client";

// ─── TakeAttendanceClient ──────────────────────────────────────────────────────
//
// Bulk present/absent toggle for all members in a batch.
// Submits via POST /api/attendance/[batchId].
//
// Offline support:
//   - Drafts are saved to IndexedDB on every status change (survives refresh)
//   - On page load, any existing draft for this batch+date is restored
//   - If the network save fails, the records are queued in IndexedDB
//   - An "online" listener auto-retries queued saves when connectivity returns
//   - A sync-status pill shows "Saved locally" vs "Synced" vs "Pending sync"

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Users, UserPlus, Wifi, WifiOff, RefreshCw } from "lucide-react";
import {
  Avatar, Badge, Button, Dialog, DialogContent, DialogFooter, DialogClose,
  FormField, Input, cn,
} from "@zenzo/ui";
import { AttendanceStatus } from "@zenzo/database/enums";
import {
  saveDraft,
  queueForSync,
  loadSession,
  clearSession,
  getAllQueued,
  type AttendanceRecord as DbRecord,
} from "@/lib/attendance-db";

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
type SyncState = "idle" | "saved_locally" | "synced" | "queued" | "syncing";

// ─── Component ─────────────────────────────────────────────────────────────────

export function TakeAttendanceClient({
  clubSlug,
  batchId,
  batchName,
  date,
  members: initialMembers,
}: TakeAttendanceClientProps) {
  const router = useRouter();

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

  const [isSaving, setIsSaving]         = React.useState(false);
  const [error, setError]               = React.useState("");
  const [syncState, setSyncState]       = React.useState<SyncState>("idle");
  const [isOnline, setIsOnline]         = React.useState(true);
  const [showDropInDialog, setShowDropInDialog] = React.useState(false);
  const [dropInPhone, setDropInPhone]   = React.useState("");
  const [dropInSearching, setDropInSearching] = React.useState(false);
  const [dropInError, setDropInError]   = React.useState("");

  // ── On mount: restore draft from IndexedDB ──────────────────────────────────
  React.useEffect(() => {
    loadSession(batchId, date).then((session) => {
      if (!session) return;
      // Merge saved statuses with any pre-existing server records
      // Server records take precedence over drafts for already-confirmed members
      const merged: StatusMap = { ...session.records.reduce((acc, r) => {
        acc[r.membership_id] = r.status as AttendanceStatus;
        return acc;
      }, {} as StatusMap) };
      // Overwrite with existing server statuses (authoritative)
      for (const m of initialMembers) {
        if (m.existingStatus) merged[m.membershipId] = m.existingStatus;
      }
      setStatuses(merged);
      if (session.type === "queued") setSyncState("queued");
      else if (session.type === "draft") setSyncState("saved_locally");
    }).catch(() => {/* IndexedDB may be unavailable — continue without it */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Online/offline listeners ────────────────────────────────────────────────
  React.useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── Auto-sync queued sessions when back online ──────────────────────────────
  React.useEffect(() => {
    if (!isOnline) return;
    getAllQueued().then(async (queued) => {
      for (const session of queued) {
        const isCurrent = session.batchId === batchId && session.date === date;
        try {
          if (isCurrent) setSyncState("syncing");
          const res = await fetch(`/api/attendance/${session.batchId}`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              clubSlug:     session.clubSlug,
              date:         session.date,
              records:      session.records,
              skipExisting: true,
            }),
          });
          if (res.ok) {
            await clearSession(session.batchId, session.date);
            if (isCurrent) setSyncState("synced");
          }
        } catch {
          if (isCurrent) setSyncState("queued");
        }
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // ── Navigate-away guard ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const buildRecords = (currentStatuses: StatusMap, currentMembers: BatchMember[]): DbRecord[] =>
    currentMembers.map((m) => ({
      membership_id: m.membershipId,
      status:        currentStatuses[m.membershipId] ?? AttendanceStatus.Unmarked,
      is_drop_in:    m.isDropIn ?? false,
    }));

  const toggle = (membershipId: string) => {
    setStatuses((prev) => {
      const current = prev[membershipId];
      const next = {
        ...prev,
        [membershipId]:
          current === AttendanceStatus.Present
            ? AttendanceStatus.Absent
            : AttendanceStatus.Present,
      };
      // Persist draft on every change
      saveDraft(batchId, date, clubSlug, buildRecords(next, members)).then(() =>
        setSyncState("saved_locally")
      ).catch(() => {});
      return next;
    });
  };

  const markAll = (status: AttendanceStatus) => {
    const next: StatusMap = {};
    for (const m of members) next[m.membershipId] = status;
    setStatuses(next);
    saveDraft(batchId, date, clubSlug, buildRecords(next, members)).then(() =>
      setSyncState("saved_locally")
    ).catch(() => {});
  };

  const presentCount = Object.values(statuses).filter(
    (s) => s === AttendanceStatus.Present
  ).length;

  const absentCount = Object.values(statuses).filter(
    (s) => s === AttendanceStatus.Absent
  ).length;

  // ── Drop-in search ──────────────────────────────────────────────────────────
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
      const dropIn: BatchMember = {
        membershipId:   data.membershipId,
        userId:         data.userId,
        fullName:       data.fullName,
        phone:          data.phone,
        existingStatus: null,
        isDropIn:       true,
      };
      setMembers((prev) => {
        if (prev.some((m) => m.membershipId === data.membershipId)) return prev;
        return [...prev, dropIn];
      });
      setStatuses((prev) => {
        const next = { ...prev, [data.membershipId]: AttendanceStatus.Present };
        // Use the current members list + the new drop-in — avoids stale closure
        const updatedMembers = members.some((m) => m.membershipId === data.membershipId)
          ? members
          : [...members, dropIn];
        saveDraft(batchId, date, clubSlug, buildRecords(next, updatedMembers))
          .then(() => setSyncState("saved_locally"))
          .catch(() => {});
        return next;
      });
      setDropInPhone("");
      setShowDropInDialog(false);
    } catch {
      setDropInError("Network error.");
    } finally {
      setDropInSearching(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    const records = buildRecords(statuses, members);

    try {
      const res = await fetch(`/api/attendance/${batchId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ clubSlug, date, records }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save attendance");
        return;
      }

      // Clear draft on success
      await clearSession(batchId, date).catch(() => {});
      setSyncState("synced");
      router.push(`/${clubSlug}/attendance/history`);
      router.refresh();
    } catch {
      // Network failure — queue for sync
      await queueForSync(batchId, date, clubSlug, records).catch(() => {});
      setSyncState("queued");
      setError(
        isOnline
          ? "Save failed. Will retry when reconnected."
          : "No internet. Attendance saved locally and will sync automatically."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Sync status pill ────────────────────────────────────────────────────────
  const syncPill = (() => {
    if (!isOnline)
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-600 font-medium">
          <WifiOff className="size-3.5" /> Offline
        </span>
      );
    if (syncState === "queued")
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-600 font-medium">
          <RefreshCw className="size-3.5" /> Pending sync
        </span>
      );
    if (syncState === "syncing")
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted font-medium">
          <RefreshCw className="size-3.5 animate-spin" /> Syncing…
        </span>
      );
    if (syncState === "saved_locally")
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted font-medium">
          <Wifi className="size-3.5" /> Saved locally
        </span>
      );
    if (syncState === "synced")
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-success-foreground font-medium">
          <Check className="size-3.5" /> Synced
        </span>
      );
    return null;
  })();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">{batchName}</h1>
          <p className="text-[13px] text-muted mt-0.5">
            {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              day:     "numeric",
              month:   "long",
              year:    "numeric",
            })}
          </p>
        </div>
        <div className="mt-1">{syncPill}</div>
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
            const status    = statuses[m.membershipId];
            const isPresent = status === AttendanceStatus.Present;
            const isAbsent  = status === AttendanceStatus.Absent;

            return (
              <div
                key={m.membershipId}
                className={cn(
                  "flex items-center justify-between px-4 py-3 transition-colors duration-100",
                  isPresent && "bg-success-subtle",
                  isAbsent  && "bg-error-subtle"
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
                    isPresent && "border-success bg-success text-white",
                    isAbsent  && "border-error bg-error text-white",
                    !isPresent && !isAbsent &&
                      "border-border bg-background text-muted hover:border-primary"
                  )}
                  aria-label={`Toggle ${m.fullName}`}
                >
                  {isPresent && <Check className="size-4" strokeWidth={2.5} />}
                  {isAbsent  && <X     className="size-4" strokeWidth={2.5} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Offline notice ──────────────────────────────────────────────────── */}
      {!isOnline && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-700">
          <span className="font-medium">You&apos;re offline.</span> Attendance is saved
          to this device and will sync automatically when you reconnect.
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-[13px] text-error-foreground font-medium">{error}</p>
      )}

      {/* ── Save footer ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={isSaving || members.length === 0}
          onClick={handleSave}
        >
          {isSaving
            ? "Saving…"
            : !isOnline
            ? "Save Locally"
            : "Save Attendance"}
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
              {dropInSearching ? "Searching…" : "Add Drop-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
