"use client";

// ─── BatchDetailClient ───────────────────────────────────────────────────────
//
// Responsibilities:
//   - Batch header: name, timing, days, coach, description
//   - Stat cards: Members, Today's attendance
//   - "Take Attendance" CTA + "Show QR Code" button
//   - QR modal: fullscreen QR code with live attendance count polling
//   - Members roster table (desktop) / cards (mobile)
//   - "Add Member to Batch" — Dialog with searchable member picker
//   - Remove member from batch

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  CalendarCheck2,
  UserPlus,
  User,
  Pencil,
  MoreVertical,
  Trash2,
  Search,
  QrCode,
  X,
  RefreshCw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogClose,
  cn,
} from "@zenzo/ui";
import { DayOfWeek, MembershipStatus } from "@zenzo/database/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchMemberRow {
  memberBatchId: string;   // member_batches.id (for removal)
  membershipId:  string;
  userId:        string;
  fullName:      string;
  phone:         string;
  status:        MembershipStatus;
}

export interface BatchDetail {
  id:           string;
  name:         string;
  startTime:    string;
  endTime:      string;
  days:         DayOfWeek[];
  coachName:    string | null;
  maxCapacity:  number | null;
  description:  string | null;
  memberCount:  number;
  todayPresent: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.Mon, DayOfWeek.Tue, DayOfWeek.Wed,
  DayOfWeek.Thu, DayOfWeek.Fri, DayOfWeek.Sat, DayOfWeek.Sun,
];

const DAY_LABEL: Record<DayOfWeek, string> = {
  [DayOfWeek.Mon]: "Mon",
  [DayOfWeek.Tue]: "Tue",
  [DayOfWeek.Wed]: "Wed",
  [DayOfWeek.Thu]: "Thu",
  [DayOfWeek.Fri]: "Fri",
  [DayOfWeek.Sat]: "Sat",
  [DayOfWeek.Sun]: "Sun",
};

function formatTime(time: string): string {
  if (!time) return "";
  const parts = time.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDays(days: DayOfWeek[]): string {
  const sorted = [...days].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );
  return sorted.map((d) => DAY_LABEL[d]).join(" · ");
}

const STATUS_CONFIG: Record<
  MembershipStatus,
  { label: string; variant: "success" | "error" | "neutral" | "info" }
> = {
  [MembershipStatus.Active]:        { label: "Active",         variant: "success" },
  [MembershipStatus.Overdue]:       { label: "Overdue",        variant: "error"   },
  [MembershipStatus.Expired]:       { label: "Expired",        variant: "neutral" },
  [MembershipStatus.PendingInvite]: { label: "Pending Invite", variant: "info"    },
  [MembershipStatus.Deleted]:       { label: "Deleted",        variant: "neutral" },
};

// ─── BatchDetailClient ────────────────────────────────────────────────────────

interface Props {
  batch:     BatchDetail;
  members:   BatchMemberRow[];
  clubSlug:  string;
}

export function BatchDetailClient({ batch, members: initialMembers, clubSlug }: Props) {
  const router = useRouter();

  const [members, setMembers] = React.useState<BatchMemberRow[]>(initialMembers);
  const [showQr, setShowQr]   = React.useState(false);

  // ── Remove member from batch ─────────────────────────────────────────────
  async function handleRemoveMember(memberBatchId: string, name: string) {
    if (!confirm(`Remove ${name} from this batch?`)) return;

    const res = await fetch(
      `/api/batches/${batch.id}/members/${memberBatchId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.memberBatchId !== memberBatchId));
    }
  }

  // ── After adding a member: full page refresh to re-fetch data ────────────
  function handleMemberAdded() {
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* ── Batch header ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-[24px] font-bold text-foreground leading-tight">
            {batch.name}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<QrCode className="size-4" />}
              onClick={() => setShowQr(true)}
            >
              QR Code
            </Button>
            <Button
              variant="secondary"
              icon={<Pencil className="size-4" />}
              onClick={() => router.push(`/${clubSlug}/batches/${batch.id}?edit=1`)}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Timing + days + coach */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
          </span>
          <span>{formatDays(batch.days)}</span>
          {batch.coachName && (
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {batch.coachName}
            </span>
          )}
        </div>

        {batch.description && (
          <p className="mt-2 text-[13px] text-muted">{batch.description}</p>
        )}
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Members"
          value={`${members.length}${batch.maxCapacity != null ? `/${batch.maxCapacity}` : ""}`}
          icon={<Users className="size-5 text-muted" />}
        />
        <StatCard
          label="Today"
          value={`${batch.todayPresent}/${members.length}`}
          icon={<CalendarCheck2 className="size-5 text-muted" />}
        />
      </div>

      {/* ── Take Attendance CTA ──────────────────────────────────────────── */}
      <Link href={`/${clubSlug}/attendance/take/${batch.id}`}>
        <Button variant="primary" className="w-full sm:w-auto">
          Take Attendance
        </Button>
      </Link>

      {/* ── Members section ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-semibold text-foreground">
            Members in this batch
          </h2>
          <AddMemberDialog
            batchId={batch.id}
            clubSlug={clubSlug}
            existingMembershipIds={members.map((m) => m.membershipId)}
            onAdded={handleMemberAdded}
          />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-subtle border-b border-border">
                {(["Name", "Phone", "Status"] as const).map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]"
                  >
                    {col}
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-muted">
                    No members in this batch yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const statusCfg = STATUS_CONFIG[member.status];
                  return (
                    <tr
                      key={member.memberBatchId}
                      className="hover:bg-surface-subtle transition-colors duration-100 group"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/${clubSlug}/members/${member.userId}`}
                          className="inline-flex items-center gap-3 hover:underline underline-offset-2"
                        >
                          <Avatar name={member.fullName} size="sm" />
                          <span className="font-medium text-foreground">
                            {member.fullName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted font-mono text-[13px]">
                        {member.phone}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={statusCfg.variant}
                          label={statusCfg.label}
                          dot
                          size="sm"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton
                              icon={<MoreVertical className="size-4" />}
                              label="Member actions"
                              className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              icon={<User />}
                              onSelect={() =>
                                router.push(`/${clubSlug}/members/${member.userId}`)
                              }
                            >
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              icon={<Trash2 />}
                              onSelect={() =>
                                handleRemoveMember(member.memberBatchId, member.fullName)
                              }
                              className="text-error-foreground focus:text-error-foreground"
                            >
                              Remove from Batch
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {members.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-8">
              No members in this batch yet.
            </p>
          ) : (
            members.map((member) => {
              const statusCfg = STATUS_CONFIG[member.status];
              return (
                <div
                  key={member.memberBatchId}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background"
                >
                  <Link
                    href={`/${clubSlug}/members/${member.userId}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar name={member.fullName} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[14px] text-foreground truncate">
                        {member.fullName}
                      </p>
                      <p className="text-[13px] text-muted font-mono mt-0.5">
                        {member.phone}
                      </p>
                    </div>
                  </Link>
                  <Badge
                    variant={statusCfg.variant}
                    label={statusCfg.label}
                    size="sm"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── QR modal ─────────────────────────────────────────────────────── */}
      {showQr && (
        <QrModal
          batchId={batch.id}
          batchName={batch.name}
          memberCount={members.length}
          clubSlug={clubSlug}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}

// ─── QrModal ──────────────────────────────────────────────────────────────────
//
// Fullscreen overlay that:
//   1. Fetches a signed QR token from GET /api/batches/[batchId]/qr
//   2. Renders the QR code via qrcode.react
//   3. Polls present count every 30 seconds (while open)
//   4. Shows refresh button when token is expired (next day)

interface QrModalProps {
  batchId:     string;
  batchName:   string;
  memberCount: number;
  clubSlug:    string;
  onClose:     () => void;
}

interface QrData {
  checkInUrl: string;
  token:      string;
  expiresAt:  string;
}

function QrModal({ batchId, batchName, memberCount, clubSlug, onClose }: QrModalProps) {
  const [qrData,   setQrData]   = React.useState<QrData | null>(null);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState("");
  const [present,  setPresent]  = React.useState(0);
  const [expired,  setExpired]  = React.useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const fetchQr = React.useCallback(async () => {
    setLoading(true);
    setError("");
    setExpired(false);
    try {
      const res  = await fetch(`/api/batches/${batchId}/qr?clubSlug=${encodeURIComponent(clubSlug)}`);
      const data = await res.json() as QrData & { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to generate QR code"); return; }
      setQrData(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [batchId, clubSlug]);

  const fetchCount = React.useCallback(async (token: string) => {
    try {
      const res  = await fetch(
        `/api/checkin?batchId=${batchId}&date=${today}&token=${encodeURIComponent(token)}`
      );
      if (!res.ok) return;
      const data = await res.json() as { present: number };
      setPresent(data.present);
    } catch {
      // Silent — count update is non-critical
    }
  }, [batchId, today]);

  // Initial load
  React.useEffect(() => { void fetchQr(); }, [fetchQr]);

  // Poll present count every 30 seconds while open
  React.useEffect(() => {
    if (!qrData) return;
    void fetchCount(qrData.token);

    const id = setInterval(() => {
      // Check if token has expired (new day)
      if (Date.now() > new Date(qrData.expiresAt).getTime()) {
        setExpired(true);
        clearInterval(id);
        return;
      }
      void fetchCount(qrData.token);
    }, 30_000);

    return () => clearInterval(id);
  }, [qrData, fetchCount]);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="QR code attendance"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-[16px] font-semibold text-foreground">{batchName}</p>
          <p className="text-[12px] text-muted">
            {new Date(today + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "short", day: "numeric", month: "short",
            })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-surface-subtle transition-colors"
          aria-label="Close QR modal"
        >
          <X className="size-5 text-muted" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8">
        {loading && (
          <div className="text-[14px] text-muted">Generating QR code…</div>
        )}

        {error && !loading && (
          <div className="text-center space-y-3">
            <p className="text-[14px] text-error-foreground">{error}</p>
            <Button variant="secondary" onClick={() => void fetchQr()}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && qrData && (
          <>
            {/* Live count */}
            <div className="text-center">
              <p className="text-[48px] font-bold text-foreground leading-none">
                {present}
                <span className="text-[24px] text-muted font-normal">/{memberCount}</span>
              </p>
              <p className="text-[13px] text-muted mt-1 uppercase tracking-wider font-medium">
                Present today
              </p>
            </div>

            {/* QR code */}
            {expired ? (
              <div className="text-center space-y-4">
                <div className="size-56 rounded-2xl border border-border bg-surface-subtle flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-[13px] text-muted">QR code expired</p>
                    <p className="text-[12px] text-muted">Valid for today only</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  icon={<RefreshCw className="size-4" />}
                  onClick={() => void fetchQr()}
                >
                  Refresh QR Code
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white shadow-lg border border-border">
                <QRCodeSVG
                  value={qrData.checkInUrl}
                  size={220}
                  level="M"
                  marginSize={0}
                />
              </div>
            )}

            {/* Instructions */}
            <div className="text-center max-w-xs space-y-1">
              <p className="text-[14px] font-medium text-foreground">
                Members scan to check in
              </p>
              <p className="text-[13px] text-muted">
                No app needed — just a camera. Count updates every 30 seconds.
              </p>
            </div>

            {/* Expiry note */}
            <p className="text-[11px] text-muted">
              Valid until midnight ·{" "}
              {new Date(qrData.expiresAt).toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-[22px] font-bold text-foreground leading-none mb-1">
        {value}
      </p>
      <p className="text-[12px] text-muted uppercase tracking-[0.04em] font-medium">
        {label}
      </p>
    </div>
  );
}

// ─── AddMemberDialog ──────────────────────────────────────────────────────────
//
// Opens a Dialog. Fetches active members of the club not already in this batch.
// Searchable list — pick one → POST /api/batches/[batchId]/members.

interface AddMemberDialogProps {
  batchId:                 string;
  clubSlug:                string;
  existingMembershipIds:   string[];
  onAdded:                 () => void;
}

interface ClubMemberOption {
  membershipId: string;
  userId:       string;
  fullName:     string;
  phone:        string;
}

function AddMemberDialog({
  batchId,
  clubSlug,
  existingMembershipIds,
  onAdded,
}: AddMemberDialogProps) {
  const [open,    setOpen]    = React.useState(false);
  const [search,  setSearch]  = React.useState("");
  const [options, setOptions] = React.useState<ClubMemberOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [adding,  setAdding]  = React.useState<string | null>(null);
  const [error,   setError]   = React.useState("");

  // Fetch eligible members when dialog opens
  React.useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError("");

    fetch(`/api/batches/${batchId}/eligible-members?clubSlug=${encodeURIComponent(clubSlug)}`)
      .then((r) => r.json())
      .then((data: { members?: ClubMemberOption[]; error?: string }) => {
        if (data.error) {
          setError(data.error);
          setOptions([]);
        } else {
          // Filter out members already in this batch
          const existing = new Set(existingMembershipIds);
          setOptions(
            (data.members ?? []).filter((m) => !existing.has(m.membershipId))
          );
        }
      })
      .catch(() => setError("Failed to load members."))
      .finally(() => setLoading(false));
  }, [open, batchId, clubSlug, existingMembershipIds]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.phone.includes(q)
    );
  }, [options, search]);

  async function handleAdd(membershipId: string) {
    setAdding(membershipId);
    setError("");

    try {
      const res = await fetch(`/api/batches/${batchId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to add member.");
        return;
      }

      setOpen(false);
      setSearch("");
      onAdded();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdding(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          icon={<UserPlus className="size-4" />}
          size="sm"
        >
          Add Member
        </Button>
      </DialogTrigger>

      <DialogContent title="Add Member to Batch">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-xl border border-border bg-background",
              "pl-9 pr-4 py-2.5 text-[14px] text-foreground placeholder:text-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-64 -mx-1 px-1 space-y-1">
          {loading ? (
            <p className="text-[13px] text-muted text-center py-6">Loading…</p>
          ) : error ? (
            <p className="text-[13px] text-error-foreground text-center py-4">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-6">
              {options.length === 0
                ? "All active members are already in this batch."
                : "No members match your search."}
            </p>
          ) : (
            filtered.map((m) => (
              <button
                key={m.membershipId}
                type="button"
                disabled={adding === m.membershipId}
                onClick={() => handleAdd(m.membershipId)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                  "hover:bg-surface-subtle transition-colors duration-100",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                <Avatar name={m.fullName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">
                    {m.fullName}
                  </p>
                  <p className="text-[12px] text-muted font-mono">{m.phone}</p>
                </div>
                {adding === m.membershipId && (
                  <span className="text-[12px] text-muted">Adding…</span>
                )}
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
