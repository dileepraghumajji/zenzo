// ─── Member Profile Page ────────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/members/:memberId  (memberId = users.id)
//
// Fetches membership + user details for this club.
// Passes to MemberProfileClient for tab rendering.

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MemberProfileClient } from "./_components/member-profile-client";
import type { MembershipStatus, AttendanceStatus } from "@zenzo/database/enums";

interface Props {
  params: { clubSlug: string; memberId: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: "Member Profile" };
}

export default async function MemberProfilePage({ params }: Props) {
  const { clubSlug, memberId } = params;
  const supabase = createSupabaseServerClient();

  // ── Resolve club ─────────────────────────────────────────────────────────
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) notFound();

  // ── Fetch membership + user + plan ───────────────────────────────────────
  const { data: membership, error } = await supabase
    .from("club_memberships")
    .select(
      "id, plan_id, status, joined_at, next_due_date, users(id, full_name, phone, email), fee_plans(name, amount_paise)"
    )
    .eq("club_id", club.id)
    .eq("user_id", params.memberId)
    .is("deleted_at", null)
    .single();

  if (error || !membership) notFound();

  // ── Fetch all available plans for this club ────────────────────────────────
  const { data: availablePlans } = await supabase
    .from("fee_plans")
    .select("id, name, amount_paise, billing_cycle")
    .eq("club_id", club.id)
    .order("amount_paise");

  // ── Fetch all available batches for this club ─────────────────────────────
  const { data: availableBatches } = await supabase
    .from("batches")
    .select("id, name")
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .order("name");

  // ── Fetch member's current batch assignments ─────────────────────────────
  const { data: batchRows } = await supabase
    .from("member_batches")
    .select("id, batch_id, batches(name)")
    .eq("membership_id", membership.id);

  const batchNames = (batchRows ?? [])
    .map((r) => r.batches?.name)
    .filter((n): n is string => Boolean(n));

  const currentBatchIds = (batchRows ?? [])
    .map((r) => r.batch_id)
    .filter((id): id is string => Boolean(id));

  // ── Fetch attendance stats (last 30 days) ──────────────────────────────────
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: attendanceRows } = await supabase
    .from("attendance_records")
    .select("id, date, status, batches(name)")
    .eq("membership_id", membership.id)
    .gte("date", thirtyDaysAgo)
    .order("date", { ascending: false });

  const totalSessions  = attendanceRows?.length ?? 0;
  const presentCount   = attendanceRows?.filter((r) => r.status === "present").length ?? 0;
  const attendancePct  = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

  // ── Fetch all payments ───────────────────────────────────────────────────
  const { data: allPayments } = await supabase
    .from("payments")
    .select("id, amount_paise, method, payment_date")
    .eq("membership_id", membership.id)
    .order("payment_date", { ascending: false });

  // ── Fetch achievements for this member at this club ───────────────────────
  const { data: achievementRows } = await supabase
    .from("member_achievements")
    .select("id, title, description, badge_icon, awarded_at, awarded_by")
    .eq("user_id", params.memberId)
    .eq("club_id", club.id)
    .order("awarded_at", { ascending: false });

  const awarderIds = [...new Set(
    (achievementRows ?? []).map((a) => a.awarded_by).filter((id): id is string => Boolean(id))
  )];
  let awarderMap: Record<string, string> = {};
  if (awarderIds.length > 0) {
    const { data: awarders } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", awarderIds);
    awarderMap = Object.fromEntries((awarders ?? []).map((u) => [u.id, u.full_name]));
  }

  const initialAchievements = (achievementRows ?? []).map((a) => ({
    id:            a.id,
    title:         a.title,
    description:   a.description,
    badgeIcon:     a.badge_icon,
    awardedAt:     a.awarded_at,
    awardedByName: a.awarded_by ? (awarderMap[a.awarded_by] ?? null) : null,
  }));

  const user = membership.users;

  return (
    <MemberProfileClient
      clubSlug={clubSlug}
      availablePlans={availablePlans ?? []}
      availableBatches={(availableBatches ?? []).map((b) => ({ id: b.id, name: b.name }))}
      currentBatchIds={currentBatchIds}
      initialAchievements={initialAchievements}
      member={{
        userId:          params.memberId,
        membershipId:    membership.id,
        planId:          membership.plan_id,
        fullName:        user?.full_name ?? "Unknown",
        phone:           user?.phone ?? "",
        email:           user?.email ?? null,
        status:          membership.status as MembershipStatus,
        joinedAt:        membership.joined_at,
        nextDueDate:     membership.next_due_date,
        planName:        membership.fee_plans?.name ?? null,
        planAmountPaise: membership.fee_plans?.amount_paise ?? null,
        batchNames,
        attendancePct,
        recentAttendance: (attendanceRows ?? []).map((a) => ({
          id: a.id,
          date: a.date,
          status: a.status as AttendanceStatus,
          batchName: a.batches?.name ?? null,
        })),
        allPayments:  (allPayments ?? []).map((p) => ({
          id:          p.id,
          amountPaise: p.amount_paise,
          method:      p.method,
          date:        p.payment_date,
        })),
      }}
    />
  );
}
