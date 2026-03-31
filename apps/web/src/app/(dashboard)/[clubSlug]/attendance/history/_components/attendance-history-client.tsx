"use client";

// ─── AttendanceHistoryClient ──────────────────────────────────────────────────
//
// Displays attendance sessions grouped by date.
// Filter by batch. Shows per-session present/absent/total summary.

import * as React from "react";
import Link from "next/link";
import { Check, X, Calendar } from "lucide-react";
import { Badge, Select, SelectTrigger, SelectContent, SelectItem } from "@zenzo/ui";
import { formatDate } from "@zenzo/utils";
import { AttendanceStatus } from "@zenzo/database/enums";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  memberName: string;
  batchId: string;
  batchName: string;
}

interface BatchOption {
  id: string;
  name: string;
}

interface AttendanceHistoryClientProps {
  clubSlug: string;
  records: AttendanceRecord[];
  batches: BatchOption[];
}

// Group records by date + batch into sessions
interface Session {
  date: string;
  batchId: string;
  batchName: string;
  present: number;
  absent: number;
  unmarked: number;
  total: number;
}

function buildSessions(records: AttendanceRecord[]): Session[] {
  const map = new Map<string, Session>();

  for (const r of records) {
    const key = `${r.date}__${r.batchId}`;
    if (!map.has(key)) {
      map.set(key, {
        date: r.date,
        batchId: r.batchId,
        batchName: r.batchName,
        present: 0,
        absent: 0,
        unmarked: 0,
        total: 0,
      });
    }
    const session = map.get(key)!;
    session.total++;
    if (r.status === AttendanceStatus.Present) session.present++;
    else if (r.status === AttendanceStatus.Absent) session.absent++;
    else session.unmarked++;
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AttendanceHistoryClient({
  clubSlug,
  records,
  batches,
}: AttendanceHistoryClientProps) {
  const [filterBatch, setFilterBatch] = React.useState("all");

  const filtered = filterBatch === "all"
    ? records
    : records.filter((r) => r.batchId === filterBatch);

  const sessions = buildSessions(filtered);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">
            Attendance History
          </h1>
          <p className="text-[13px] text-muted mt-0.5">Last 30 days</p>
        </div>

        {batches.length > 1 && (
          <div className="w-48">
            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger placeholder="All Batches" />
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Sessions list ─────────────────────────────────────────────────── */}
      {sessions.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Calendar className="size-8 text-muted mx-auto" />
          <p className="text-[14px] text-muted">No attendance sessions yet.</p>
          <p className="text-[13px] text-muted">
            Go to a batch and tap{" "}
            <strong>Take Attendance</strong> to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Link
              key={`${s.date}-${s.batchId}`}
              href={`/${clubSlug}/attendance/take/${s.batchId}`}
              className="block rounded-xl border border-border bg-background p-4 hover:bg-surface-subtle transition-colors duration-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {s.batchName}
                  </p>
                  <p className="text-[13px] text-muted mt-0.5">
                    {formatDate(s.date)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-[13px] text-success-foreground">
                    <Check className="size-3.5" strokeWidth={2.5} />
                    <span className="font-medium">{s.present}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] text-error-foreground">
                    <X className="size-3.5" strokeWidth={2.5} />
                    <span className="font-medium">{s.absent}</span>
                  </div>
                  {s.unmarked > 0 && (
                    <Badge
                      variant="neutral"
                      label={`${s.unmarked} unmarked`}
                      size="sm"
                    />
                  )}
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-300"
                  style={{
                    width: s.total > 0 ? `${(s.present / s.total) * 100}%` : "0%",
                  }}
                />
              </div>
              <p className="text-[11px] text-muted mt-1">
                {s.total > 0
                  ? `${Math.round((s.present / s.total) * 100)}% attendance`
                  : "No data"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
