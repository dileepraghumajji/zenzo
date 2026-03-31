// ─── Batch Detail Page ───────────────────────────────────────────────────────
//
// Layer 3: Server Component — fetches batch + member roster + stats.
// All interactivity (add member dialog, remove member) lives in BatchDetailClient.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DayOfWeek, MembershipStatus } from "@zenzo/database/enums";
import {
  BatchDetailClient,
  BatchMemberRow,
  BatchDetail,
} from "./_components/batch-detail-client";

interface Props {
  params: { clubSlug: string; batchId: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: "Batch Detail" };
}

export default async function BatchDetailPage({ params }: Props) {
  const { clubSlug, batchId } = params;
  const supabase = createSupabaseServerClient();

  // ── 1. Resolve club id ───────────────────────────────────────────────────
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) notFound();

  // ── 2. Fetch batch ───────────────────────────────────────────────────────
  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("id, name, start_time, end_time, days, coach_id, max_capacity, description")
    .eq("id", batchId)
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .single();

  if (batchError || !batch) notFound();

  // ── 3. Fetch coach name ──────────────────────────────────────────────────
  let coachName: string | null = null;

  if (batch.coach_id) {
    const { data: coach } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", batch.coach_id)
      .single();
    coachName = coach?.full_name ?? null;
  }

  // ── 4. Fetch members in this batch ───────────────────────────────────────
  // member_batches → club_memberships (for status) → users (for name/phone)
  // Two-query strategy to avoid type collapse.

  const { data: memberBatches } = await supabase
    .from("member_batches")
    .select("id, membership_id")
    .eq("batch_id", batchId);

  const membershipIds = (memberBatches ?? []).map((mb) => mb.membership_id);

  let members: BatchMemberRow[] = [];

  if (membershipIds.length > 0) {
    const { data: memberships } = await supabase
      .from("club_memberships")
      .select("id, user_id, status")
      .in("id", membershipIds)
      .is("deleted_at", null);

    const userIds = (memberships ?? []).map((m) => m.user_id);

    const { data: users } = userIds.length > 0
      ? await supabase
          .from("users")
          .select("id, full_name, phone")
          .in("id", userIds)
      : { data: [] };

    const userMap = new Map((users ?? []).map((u) => [u.id, u]));
    const memberBatchIdMap = new Map(
      (memberBatches ?? []).map((mb) => [mb.membership_id, mb.id])
    );

    members = (memberships ?? [])
      .map((m) => {
        const user = userMap.get(m.user_id);
        if (!user) return null;
        return {
          memberBatchId: memberBatchIdMap.get(m.id) ?? "",
          membershipId:  m.id,
          userId:        m.user_id,
          fullName:      user.full_name,
          phone:         user.phone,
          status:        m.status as MembershipStatus,
        };
      })
      .filter((m): m is BatchMemberRow => m !== null);
  }

  // ── 5. Today's attendance count ──────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const { count: todayPresent } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .eq("date", today)
    .eq("status", "present");

  // ── 6. Build BatchDetail ─────────────────────────────────────────────────
  const detail: BatchDetail = {
    id:          batch.id,
    name:        batch.name,
    startTime:   batch.start_time,
    endTime:     batch.end_time,
    days:        (batch.days ?? []) as DayOfWeek[],
    coachName,
    maxCapacity: batch.max_capacity,
    description: batch.description,
    memberCount: members.length,
    todayPresent: todayPresent ?? 0,
  };

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">

      {/* Back link */}
      <Link
        href={`/${clubSlug}/batches`}
        className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Batches
      </Link>

      <BatchDetailClient
        batch={detail}
        members={members}
        clubSlug={clubSlug}
      />

    </div>
  );
}
