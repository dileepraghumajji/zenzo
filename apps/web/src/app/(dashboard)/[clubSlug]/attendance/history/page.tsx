// ─── Attendance History Page ──────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/attendance/history
//
// Fetches all attendance records for the last 30 days across all batches.
// Passes to AttendanceHistoryClient for display + filtering.

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AttendanceHistoryClient } from "./_components/attendance-history-client";
import type { AttendanceStatus } from "@zenzo/database/enums";

interface Props {
  params: { clubSlug: string };
}

export async function generateMetadata() {
  return { title: "Attendance History" };
}

export default async function AttendanceHistoryPage({ params }: Props) {
  const { clubSlug } = params;
  const supabase = createSupabaseServerClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // ── Resolve club ─────────────────────────────────────────────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // ── Fetch all batches for this club (for filter dropdown) ────────────────
  const { data: batchRows } = await supabase
    .from("batches")
    .select("id, name")
    .eq("club_id", club.id)
    .order("name");

  const batches = batchRows ?? [];

  // ── Fetch attendance records for last 30 days ────────────────────────────
  const { data: recordRows } = await supabase
    .from("attendance_records")
    .select(
      "id, date, status, membership_id, batch_id, batches(name), club_memberships(users(full_name))"
    )
    .gte("date", thirtyDaysAgo)
    .in(
      "batch_id",
      batches.map((b) => b.id)
    )
    .order("date", { ascending: false });

  const records = (recordRows ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    status: r.status as AttendanceStatus,
    memberName: r.club_memberships?.users?.full_name ?? "Unknown",
    batchId: r.batch_id,
    batchName: r.batches?.name ?? "Unknown Batch",
  }));

  return (
    <AttendanceHistoryClient
      clubSlug={clubSlug}
      records={records}
      batches={batches}
    />
  );
}
