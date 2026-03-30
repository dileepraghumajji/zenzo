"use client";

// ─── Members Client ────────────────────────────────────────────────────────────
//
// Responsibilities (all client-side):
//   - Debounced search on name / phone
//   - Status filter chips
//   - Desktop: table with row actions menu
//   - Mobile:  stacked cards
//   - Pagination: 25/page desktop, infinite scroll mobile (future)
//
// Data comes from MembersLoader (Server Component) — no fetching here.

import * as React from "react";
import Link from "next/link";
import { Search, MoreVertical, UserPlus, Users } from "lucide-react";
import { Avatar, Badge, Button, cn } from "@zenzo/ui";
import { formatCurrency, formatDate } from "@zenzo/utils";
import { MembershipStatus } from "@zenzo/database/enums";
import { Skeleton } from "@/components/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberRow {
  id: string;          // membership id
  userId: string;
  fullName: string;
  phone: string;
  status: MembershipStatus;
  joinedAt: string;
  planName: string | null;
  planAmountPaise: number | null;
  batchNames: string[];
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  MembershipStatus,
  { label: string; variant: "success" | "error" | "neutral" | "info" }
> = {
  [MembershipStatus.Active]:        { label: "Active",         variant: "success" },
  [MembershipStatus.Overdue]:       { label: "Overdue",        variant: "error"   },
  [MembershipStatus.Expired]:       { label: "Expired",        variant: "neutral" },
  [MembershipStatus.PendingInvite]: { label: "Pending Invite", variant: "info"    },
};

// ─── Filter chips config ──────────────────────────────────────────────────────

type StatusFilter = MembershipStatus | "all";

const FILTER_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: "all",                         label: "All"          },
  { value: MembershipStatus.Active,        label: "Active"       },
  { value: MembershipStatus.Overdue,       label: "Overdue"      },
  { value: MembershipStatus.Expired,       label: "Expired"      },
  { value: MembershipStatus.PendingInvite, label: "Pending"      },
];

const PAGE_SIZE = 25;

// ─── MembersClient ────────────────────────────────────────────────────────────

interface MembersClientProps {
  members: MemberRow[];
  clubSlug: string;
}

export function MembersClient({ members, clubSlug }: MembersClientProps) {
  const [search, setSearch]           = React.useState("");
  const [debouncedSearch, setDebounced] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [page, setPage]               = React.useState(1);
  const [openMenuId, setOpenMenuId]   = React.useState<string | null>(null);

  // Debounce search input 300 ms
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Reset to page 1 whenever filters change
  React.useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  // Close row menu on outside click
  React.useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenuId]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return members.filter((m) => {
      const matchesStatus =
        statusFilter === "all" || m.status === statusFilter;

      const matchesSearch =
        debouncedSearch === "" ||
        m.fullName.toLowerCase().includes(debouncedSearch) ||
        m.phone.includes(debouncedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [members, statusFilter, debouncedSearch]);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start       = (currentPage - 1) * PAGE_SIZE;
  const paginated   = filtered.slice(start, start + PAGE_SIZE);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-[16px] font-semibold text-foreground mb-1">No members yet</p>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Add your first member to get started.
        </p>
        <Link href={`/${clubSlug}/members/invite`}>
          <Button variant="primary" icon={<UserPlus className="w-4 h-4" />}>
            Add Member
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Search + filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className={cn(
              "w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-colors"
            )}
          />
        </div>

        {/* Status filter chips — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={cn(
                "shrink-0 h-8 px-3 rounded-full text-[13px] font-medium border transition-colors",
                statusFilter === chip.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-surface-subtle"
              )}
            >
              {chip.label}
              {chip.value !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {members.filter((m) => m.status === chip.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────────────────────── */}
      <p className="text-[13px] text-muted-foreground">
        {filtered.length === members.length
          ? `${members.length} member${members.length !== 1 ? "s" : ""}`
          : `${filtered.length} of ${members.length} members`}
      </p>

      {/* ── Desktop table ────────────────────────────────────────────────────── */}
      <div className="hidden lg:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-subtle border-b border-border">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Phone
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Batch
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Plan
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No members match your search.
                </td>
              </tr>
            ) : (
              paginated.map((member) => {
                const statusCfg = STATUS_CONFIG[member.status];
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-subtle transition-colors group"
                  >
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/${clubSlug}/members/${member.userId}`}
                        className="flex items-center gap-3 hover:underline underline-offset-2"
                      >
                        <Avatar name={member.fullName} size="sm" />
                        <span className="font-medium text-foreground">
                          {member.fullName}
                        </span>
                      </Link>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[13px]">
                      {member.phone}
                    </td>

                    {/* Batch(es) */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.batchNames.length === 0
                        ? <span className="text-muted-foreground/50">—</span>
                        : member.batchNames.join(", ")}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={statusCfg.variant}
                        label={statusCfg.label}
                        dot
                        size="sm"
                      />
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[13px]">
                      {member.planAmountPaise != null
                        ? formatCurrency(member.planAmountPaise)
                        : <span className="text-muted-foreground/50">—</span>}
                    </td>

                    {/* Row actions */}
                    <td className="px-2 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === member.id ? null : member.id);
                        }}
                        className={cn(
                          "opacity-0 group-hover:opacity-100 transition-opacity",
                          "w-8 h-8 rounded-md flex items-center justify-center",
                          "hover:bg-surface-subtle text-muted-foreground",
                          openMenuId === member.id && "opacity-100 bg-surface-subtle"
                        )}
                        aria-label="Row actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === member.id && (
                        <div
                          className={cn(
                            "absolute right-2 top-10 z-10 w-48",
                            "bg-background border border-border rounded-xl shadow-lg py-1"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowMenuItem href={`/${clubSlug}/members/${member.userId}`}>
                            View Profile
                          </RowMenuItem>
                          <RowMenuItem href={`/${clubSlug}/members/${member.userId}?edit=1`}>
                            Edit
                          </RowMenuItem>
                          <div className="my-1 border-t border-border" />
                          <RowMenuItem href={`/${clubSlug}/members/${member.userId}?action=whatsapp`}>
                            Send WhatsApp
                          </RowMenuItem>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ─────────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {paginated.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No members match your search.
          </p>
        ) : (
          paginated.map((member) => {
            const statusCfg = STATUS_CONFIG[member.status];
            return (
              <Link
                key={member.id}
                href={`/${clubSlug}/members/${member.userId}`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border border-border",
                  "bg-background hover:bg-surface-subtle transition-colors"
                )}
              >
                <Avatar name={member.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px] text-foreground truncate">
                    {member.fullName}
                  </p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    {member.batchNames.length > 0
                      ? member.batchNames[0]
                      : "No batch"}
                    {member.planAmountPaise != null && (
                      <> · <span className="font-mono">{formatCurrency(member.planAmountPaise)}</span></>
                    )}
                  </p>
                </div>
                <Badge
                  variant={statusCfg.variant}
                  label={statusCfg.label}
                  size="sm"
                />
              </Link>
            );
          })
        )}
      </div>

      {/* ── Pagination (desktop) ─────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="hidden lg:flex items-center justify-between pt-2 text-[13px] text-muted-foreground">
          <span>
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ←
            </PaginationButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <PaginationButton
                key={n}
                onClick={() => setPage(n)}
                active={n === currentPage}
              >
                {n}
              </PaginationButton>
            ))}
            <PaginationButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              →
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function RowMenuItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-[13px] text-foreground hover:bg-surface-subtle transition-colors"
    >
      {children}
    </Link>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-8 h-8 rounded-md text-[13px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-surface-subtle text-foreground",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

// ─── MemberListSkeleton ───────────────────────────────────────────────────────
// Lives alongside MembersClient per CLAUDE.md rule.
// Used in page.tsx as the Suspense fallback.

export function MemberListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full" />
      {/* Filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden lg:block rounded-xl border border-border overflow-hidden">
        <div className="bg-surface-subtle px-4 py-3 border-b border-border">
          <Skeleton className="h-4 w-48" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="size-7 rounded-full shrink-0" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28 ml-auto" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Mobile card skeletons */}
      <div className="lg:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
