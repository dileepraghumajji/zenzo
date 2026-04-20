// ─── MembersLoader ─────────────────────────────────────────────────────────────
//
// Async Server Component — fetches all non-deleted memberships for a club.
// Wrapped in Suspense by page.tsx so MemberListSkeleton shows while this loads.
//
// Two-query strategy (avoids deep-nesting type issues with hand-written DB types):
//   1. club_memberships → users, fee_plans  (forward FK joins)
//   2. member_batches   → batches           (batch names per membership)
// Merged in-memory before passing to MembersClient.

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MembershipStatus } from "@zenzo/database/enums";
import { MembersClient } from "./members-client";
import type { MemberRow } from "./members-client";

interface MembersLoaderProps {
  clubSlug: string;
}

export async function MembersLoader({ clubSlug }: MembersLoaderProps) {
  const supabase = createSupabaseServerClient();

  // ── 1. Resolve club slug → club id ─────────────────────────────────────────
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) notFound();

  // ── 2. Fetch memberships with user + plan info ───────────────────────────────
  const { data: memberships, error: membershipsError } = await supabase
    .from("club_memberships")
    .select("id, user_id, status, joined_at, next_due_date, users(full_name, phone), fee_plans(name, amount_paise)")
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: false });

  if (membershipsError) {
    // Surface error to Next.js error boundary rather than returning empty list.
    throw new Error(`Failed to load members: ${membershipsError.message}`);
  }

  const rows = memberships ?? [];

  // ── 3. Fetch batch assignments for these memberships ────────────────────────
  const membershipIds = rows.map((m) => m.id);

  const batchMap = new Map<string, string[]>();

  if (membershipIds.length > 0) {
    const { data: batchAssignments, error: batchError } = await supabase
      .from("member_batches")
      .select("membership_id, batches(name)")
      .in("membership_id", membershipIds);

    if (!batchError && batchAssignments) {
      for (const ba of batchAssignments) {
        const batchName = ba.batches?.name;
        if (!batchName) continue;
        const existing = batchMap.get(ba.membership_id) ?? [];
        existing.push(batchName);
        batchMap.set(ba.membership_id, existing);
      }
    }
  }

  // ── 4. Map to MemberRow view type ───────────────────────────────────────────
  const members: MemberRow[] = rows.map((m) => ({
    id:              m.id,
    userId:          m.user_id,
    fullName:        m.users?.full_name ?? "Unknown",
    phone:           m.users?.phone     ?? "",
    status:          m.status as MembershipStatus,
    joinedAt:        m.joined_at,
    nextDueDate:     m.next_due_date ?? null,
    planName:        m.fee_plans?.name        ?? null,
    planAmountPaise: m.fee_plans?.amount_paise ?? null,
    batchNames:      batchMap.get(m.id) ?? [],
  }));

  return <MembersClient members={members} clubSlug={clubSlug} />;
}
