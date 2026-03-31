// ─── Take Attendance Page ─────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/attendance/take/:batchId
//
// Fetches the batch + its members + any existing records for today.
// Passes to TakeAttendanceClient for interactive marking.

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TakeAttendanceClient } from "./_components/take-attendance-client";
import type { AttendanceStatus } from "@zenzo/database/enums";

interface Props {
  params: { clubSlug: string; batchId: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: "Take Attendance" };
}

export default async function TakeAttendancePage({ params }: Props) {
  const { clubSlug, batchId } = params;
  const supabase = createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);

  // ── Resolve club ─────────────────────────────────────────────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // ── Fetch batch ──────────────────────────────────────────────────────────
  const { data: batch } = await supabase
    .from("batches")
    .select("id, name")
    .eq("id", batchId)
    .eq("club_id", club.id)
    .single();

  if (!batch) notFound();

  // ── Fetch members in this batch ──────────────────────────────────────────
  const { data: memberBatchRows } = await supabase
    .from("member_batches")
    .select(
      "id, membership_id, club_memberships(id, user_id, status, users(id, full_name, phone))"
    )
    .eq("batch_id", batchId);

  // Filter to active members only
  const activeRows = (memberBatchRows ?? []).filter(
    (r) => r.club_memberships?.status === "active"
  );

  // ── Fetch today's existing attendance records ────────────────────────────
  const membershipIds = activeRows.map((r) => r.membership_id);

  const { data: existingRecords } =
    membershipIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("membership_id, status")
          .eq("batch_id", batchId)
          .eq("date", today)
          .in("membership_id", membershipIds)
      : { data: [] };

  const existingMap: Record<string, AttendanceStatus> = {};
  for (const r of existingRecords ?? []) {
    existingMap[r.membership_id] = r.status as AttendanceStatus;
  }

  const members = activeRows.map((r) => ({
    membershipId: r.membership_id,
    userId: r.club_memberships?.user_id ?? "",
    fullName: r.club_memberships?.users?.full_name ?? "Unknown",
    phone: r.club_memberships?.users?.phone ?? "",
    existingStatus: existingMap[r.membership_id] ?? null,
  }));

  return (
    <TakeAttendanceClient
      clubSlug={clubSlug}
      batchId={batchId}
      batchName={batch.name}
      date={today}
      members={members}
    />
  );
}
