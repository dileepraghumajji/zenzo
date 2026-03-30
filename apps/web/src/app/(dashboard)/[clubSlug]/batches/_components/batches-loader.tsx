// ─── BatchesLoader ──────────────────────────────────────────────────────────
//
// Async Server Component — fetches all batches for the club.
// Runs inside <Suspense> so BatchListSkeleton shows while loading.
//
// Three-query strategy (avoids type collapse with hand-written types):
//   1. clubs → resolve id
//   2. batches (with coach_id)
//   3. member_batches → count per batch
//   4. club_staff + users → coach names

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BatchesClient, BatchRow } from "./batches-client";
import { DayOfWeek } from "@zenzo/database/enums";

interface Props {
  clubSlug: string;
}

export async function BatchesLoader({ clubSlug }: Props) {
  const supabase = createSupabaseServerClient();

  // ── 1. Resolve club id ───────────────────────────────────────────────────
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) notFound();

  // ── 2. Fetch batches ─────────────────────────────────────────────────────
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, start_time, end_time, days, coach_id, max_capacity")
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .order("start_time");

  if (!batches || batches.length === 0) {
    return <BatchesClient batches={[]} clubSlug={clubSlug} />;
  }

  // ── 3. Member counts per batch ───────────────────────────────────────────
  const batchIds = batches.map((b) => b.id);

  const { data: memberBatches } = await supabase
    .from("member_batches")
    .select("batch_id")
    .in("batch_id", batchIds);

  const memberCountMap = new Map<string, number>();
  for (const mb of memberBatches ?? []) {
    memberCountMap.set(mb.batch_id, (memberCountMap.get(mb.batch_id) ?? 0) + 1);
  }

  // ── 4. Coach names ───────────────────────────────────────────────────────
  const coachIds = [
    ...new Set(batches.map((b) => b.coach_id).filter((id): id is string => id !== null)),
  ];

  const coachNameMap = new Map<string, string>();

  if (coachIds.length > 0) {
    const { data: coaches } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", coachIds);

    for (const c of coaches ?? []) {
      coachNameMap.set(c.id, c.full_name);
    }
  }

  // ── 5. Map to BatchRow ───────────────────────────────────────────────────
  const rows: BatchRow[] = batches.map((b) => ({
    id:           b.id,
    name:         b.name,
    startTime:    b.start_time,
    endTime:      b.end_time,
    days:         (b.days ?? []) as DayOfWeek[],
    coachName:    b.coach_id ? (coachNameMap.get(b.coach_id) ?? null) : null,
    memberCount:  memberCountMap.get(b.id) ?? 0,
    maxCapacity:  b.max_capacity,
  }));

  return <BatchesClient batches={rows} clubSlug={clubSlug} />;
}
