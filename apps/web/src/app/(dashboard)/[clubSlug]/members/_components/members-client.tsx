"use client";

// ─── Members Client ────────────────────────────────────────────────────────────
//
// Responsibilities (all client-side):
//   - Debounced search on name / phone
//   - Status filter chips
//   - Desktop: table with Radix DropdownMenu row actions
//   - Mobile:  stacked cards (tap → profile)
//   - Pagination: 25/page desktop
//
// Data comes from MembersLoader (Server Component) — no fetching here.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, UserPlus, Users, User, Pencil, MessageCircle } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  FilterChip,
  SearchInput,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from "@zenzo/ui";
import { formatCurrency } from "@zenzo/utils";
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
  [MembershipStatus.Deleted]:       { label: "Deleted",        variant: "neutral" },
};

// ─── Filter chips config ──────────────────────────────────────────────────────

type StatusFilter = MembershipStatus | "all";

const FILTER_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: "all",                          label: "All"     },
  { value: MembershipStatus.Active,        label: "Active"  },
  { value: MembershipStatus.Overdue,       label: "Overdue" },
  { value: MembershipStatus.Expired,       label: "Expired" },
  { value: MembershipStatus.PendingInvite, label: "Pending" },
];

const PAGE_SIZE = 25;

// ─── MembersClient ────────────────────────────────────────────────────────────

interface MembersClientProps {
  members: MemberRow[];
  clubSlug: string;
}

export function MembersClient({ members, clubSlug }: MembersClientProps) {
  const router = useRouter();

  const [search, setSearch]             = React.useState("");
  const [debouncedSearch, setDebounced] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [page, setPage]                 = React.useState(1);

  // Debounce search 300ms
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Reset to page 1 on filter/search change
  React.useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return members.filter((m) => {
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
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
          <Users className="w-8 h-8 text-muted" />
        </div>
        <p className="text-[16px] font-semibold text-heading mb-1">No members yet</p>
        <p className="text-[14px] text-muted mb-6 max-w-xs">
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
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by name or phone…"
        />

        {/* Filter chips — scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTER_CHIPS.map((chip) => (
            <FilterChip
              key={chip.value}
              selected={statusFilter === chip.value}
              onClick={() => setStatusFilter(chip.value)}
              count={
                chip.value !== "all"
                  ? members.filter((m) => m.status === chip.value).length
                  : undefined
              }
            >
              {chip.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────────────────────── */}
      <p className="text-[13px] text-muted">
        {filtered.length === members.length
          ? `${members.length} member${members.length !== 1 ? "s" : ""}`
          : `${filtered.length} of ${members.length} members`}
      </p>

      {/* ── Desktop table ────────────────────────────────────────────────────── */}
      <div className="hidden lg:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-subtle border-b border-border">
              {(["Name", "Phone", "Batch", "Status", "Plan"] as const).map((col) => (
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
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-muted">
                  No members match your search.
                </td>
              </tr>
            ) : (
              paginated.map((member) => {
                const statusCfg = STATUS_CONFIG[member.status];
                const profileHref = `/${clubSlug}/members/${member.userId}`;
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-subtle transition-colors duration-100 group"
                  >
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <Link
                        href={profileHref}
                        className="inline-flex items-center gap-3 hover:underline underline-offset-2"
                      >
                        <Avatar name={member.fullName} size="sm" />
                        <span className="font-medium text-foreground">
                          {member.fullName}
                        </span>
                      </Link>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-muted font-mono text-[13px]">
                      {member.phone}
                    </td>

                    {/* Batch(es) */}
                    <td className="px-4 py-3 text-muted text-[13px]">
                      {member.batchNames.length === 0
                        ? <span className="opacity-40">—</span>
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

                    {/* Plan — right-aligned mono per manifesto */}
                    <td className="px-4 py-3 text-muted font-mono text-[13px] text-right pr-6">
                      {member.planAmountPaise != null
                        ? formatCurrency(member.planAmountPaise)
                        : <span className="opacity-40">—</span>}
                    </td>

                    {/* Row actions — Radix DropdownMenu */}
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
                            onSelect={() => router.push(profileHref)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            icon={<Pencil />}
                            onSelect={() => router.push(`${profileHref}?edit=1`)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            icon={<MessageCircle />}
                            onSelect={() => router.push(`${profileHref}?action=whatsapp`)}
                          >
                            Send WhatsApp
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

      {/* ── Mobile cards ─────────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-2">
        {paginated.length === 0 ? (
          <p className="text-[13px] text-muted text-center py-8">
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
                  "bg-background hover:bg-surface-subtle active:bg-surface-subtle",
                  "transition-colors duration-100"
                )}
              >
                <Avatar name={member.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px] text-foreground truncate">
                    {member.fullName}
                  </p>
                  <p className="text-[13px] text-muted mt-0.5 truncate">
                    {member.batchNames.length > 0
                      ? member.batchNames[0]
                      : "No batch"}
                    {member.planAmountPaise != null && (
                      <>
                        {" · "}
                        <span className="font-mono">
                          {formatCurrency(member.planAmountPaise)}
                        </span>
                      </>
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
        <div className="hidden lg:flex items-center justify-between pt-2 text-[13px] text-muted">
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

// ─── PaginationButton ─────────────────────────────────────────────────────────

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
        "w-8 h-8 rounded-md text-[13px] font-medium transition-colors duration-100",
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
// Lives alongside MembersClient (CLAUDE.md rule).
// Used in page.tsx as the Suspense fallback.

export function MemberListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search */}
      <Skeleton className="h-10 w-full" />
      {/* Filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block rounded-xl border border-border overflow-hidden">
        <div className="bg-surface-subtle px-4 py-3 border-b border-border flex gap-8">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8 ml-auto" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
            <Skeleton className="size-7 rounded-full shrink-0" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28 ml-6" />
            <Skeleton className="h-4 w-24 ml-4" />
            <Skeleton className="h-5 w-16 rounded-full ml-4" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
