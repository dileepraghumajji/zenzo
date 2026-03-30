"use client";

// ─── BatchesClient ──────────────────────────────────────────────────────────
//
// Responsibilities:
//   - Card grid (2 cols desktop, 1 col mobile)
//   - Per-card: name, timing, days, member count, coach
//   - Card ⋮ menu: Edit, Delete
//   - Empty state

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  User,
  MoreVertical,
  Plus,
  CalendarDays,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Button,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from "@zenzo/ui";
import { DayOfWeek } from "@zenzo/database/enums";
import { Skeleton } from "@/components/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchRow {
  id: string;
  name: string;
  startTime: string;    // "HH:MM:SS"
  endTime: string;      // "HH:MM:SS"
  days: DayOfWeek[];
  coachName: string | null;
  memberCount: number;
  maxCapacity: number | null;
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

// ─── BatchesClient ────────────────────────────────────────────────────────────

interface BatchesClientProps {
  batches: BatchRow[];
  clubSlug: string;
}

export function BatchesClient({ batches, clubSlug }: BatchesClientProps) {
  const router = useRouter();

  // ── Empty state ──────────────────────────────────────────────────────────
  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-muted" />
        </div>
        <p className="text-[16px] font-semibold text-heading mb-1">No batches yet</p>
        <p className="text-[14px] text-muted mb-6 max-w-xs">
          Create your first batch — a batch is a group that trains together at
          the same time.
        </p>
        <Link href={`/${clubSlug}/batches/new`}>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Create Batch
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {batches.map((batch) => (
        <BatchCard
          key={batch.id}
          batch={batch}
          clubSlug={clubSlug}
          onEdit={() => router.push(`/${clubSlug}/batches/${batch.id}?edit=1`)}
          onDelete={() => {
            // Delete flow deferred — only allow if memberCount === 0
            // Will add confirmation dialog in a later sprint
            alert("Delete coming soon. Remove all members from the batch first.");
          }}
        />
      ))}
    </div>
  );
}

// ─── BatchCard ────────────────────────────────────────────────────────────────

interface BatchCardProps {
  batch: BatchRow;
  clubSlug: string;
  onEdit: () => void;
  onDelete: () => void;
}

function BatchCard({ batch, clubSlug, onEdit, onDelete }: BatchCardProps) {
  const detailHref = `/${clubSlug}/batches/${batch.id}`;

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-background",
        "hover:bg-surface-subtle transition-colors duration-100 group"
      )}
    >
      {/* ── Card header ─────────────────────────────────────────────────── */}
      <Link href={detailHref} className="block p-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[16px] font-semibold text-foreground leading-tight">
            {batch.name}
          </p>
          {/* Spacer so menu doesn't overlap title — handled by absolute menu */}
          <div className="w-8 shrink-0" />
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-[13px] text-muted mb-2">
          <Clock className="size-3.5 shrink-0" />
          <span>
            {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
          </span>
        </div>

        {/* Days */}
        <p className="text-[13px] text-muted mb-3">
          {formatDays(batch.days)}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[13px] text-muted">
            <Users className="size-3.5 shrink-0" />
            <span>
              {batch.memberCount}
              {batch.maxCapacity != null && (
                <span className="opacity-60">/{batch.maxCapacity}</span>
              )}{" "}
              {batch.memberCount === 1 ? "member" : "members"}
            </span>
          </div>

          {batch.coachName && (
            <div className="flex items-center gap-1.5 text-[13px] text-muted">
              <User className="size-3.5 shrink-0" />
              <span>{batch.coachName}</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── ⋮ menu (absolute, top-right) ────────────────────────────────── */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              icon={<MoreVertical className="size-4" />}
              label="Batch actions"
              className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem icon={<Pencil />} onSelect={onEdit}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<Trash2 />}
              onSelect={onDelete}
              className="text-error-foreground focus:text-error-foreground"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── BatchListSkeleton ─────────────────────────────────────────────────────
// Lives alongside BatchesClient (CLAUDE.md rule).
// Used as Suspense fallback in page.tsx.

export function BatchListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-24" />
          <div className="flex gap-4 pt-1">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
