"use client";

// ─── BatchDetailClient ───────────────────────────────────────────────────────
//
// Responsibilities:
//   - Batch header: name, timing, days, coach, description
//   - Stat cards: Members, Today's attendance
//   - "Take Attendance" CTA
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
} from "lucide-react";
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
