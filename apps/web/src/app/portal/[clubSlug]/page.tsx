// /portal/[clubSlug] — member view of one club
//
// Server Component: fetches membership data for the current user + this club.
// Passes to PortalClubClient for tab rendering (Home, Attendance, Payments).

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipStatus, AttendanceStatus } from "@zenzo/database/enums";
import { PortalClubClient } from "./_components/portal-club-client";

interface Props {
  params: { clubSlug: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: "My Club" };
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton-shimmer h-20 rounded-xl" />
      <div className="skeleton-shimmer h-10 rounded-lg" />
      <div className="skeleton-shimmer h-40 rounded-xl" />
      <div className="skeleton-shimmer h-40 rounded-xl" />
    </div>
  );
}

async function PortalClubData({ clubSlug }: { clubSlug: string }) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // ── Resolve club ────────────────────────────────────────────────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, phone")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // ── Membership for this user in this club ───────────────────────────────────
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("id, status, joined_at, next_due_date, plan_id")
    .eq("user_id", user.id)
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: false })
    .limit(1)
    .single();

  if (!membership) notFound();

  // ── Fee plan ────────────────────────────────────────────────────────────────
  const { data: feePlan } = membership.plan_id
    ? await supabase
        .from("fee_plans")
        .select("id, name, amount_paise, billing_cycle")
        .eq("id", membership.plan_id)
        .single()
    : { data: null };

  // ── Batches this member is in ───────────────────────────────────────────────
  const { data: memberBatchRows } = await supabase
    .from("member_batches")
    .select("id, batch_id")
    .eq("membership_id", membership.id);

  const batchIds = (memberBatchRows ?? []).map((r) => r.batch_id);

  const { data: batches } = batchIds.length
    ? await supabase
        .from("batches")
        .select("id, name, start_time, end_time, days")
        .in("id", batchIds)
        .is("deleted_at", null)
    : { data: [] };

  // ── Attendance this month ───────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: attendanceThisMonth } = await supabase
    .from("attendance_records")
    .select("id, date, status, batch_id")
    .eq("membership_id", membership.id)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("date", { ascending: false });

  // ── Last 90 days attendance (for heatmap) ───────────────────────────────────
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: attendanceLast90 } = await supabase
    .from("attendance_records")
    .select("id, date, status, batch_id")
    .eq("membership_id", membership.id)
    .gte("date", ninetyDaysAgo)
    .order("date", { ascending: false });

  // ── Payments ────────────────────────────────────────────────────────────────
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount_paise, method, payment_date, reference, note")
    .eq("membership_id", membership.id)
    .order("payment_date", { ascending: false });

  // ── Attendance stats ────────────────────────────────────────────────────────
  const presentThisMonth = (attendanceThisMonth ?? []).filter(
    (a) => a.status === AttendanceStatus.Present
  ).length;
  const totalThisMonth = (attendanceThisMonth ?? []).length;

  // Calculate streak (consecutive present days going backward)
  const sortedAtt = [...(attendanceLast90 ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let streak = 0;
  for (const record of sortedAtt) {
    if (record.status === AttendanceStatus.Present) {
      streak++;
    } else {
      break;
    }
  }

  return (
    <PortalClubClient
      club={{ id: club.id, name: club.name, slug: club.slug, phone: club.phone }}
      membership={{
        id: membership.id,
        status: membership.status,
        joined_at: membership.joined_at,
        next_due_date: membership.next_due_date,
      }}
      feePlan={feePlan}
      batches={batches ?? []}
      attendanceThisMonth={attendanceThisMonth ?? []}
      attendanceLast90={attendanceLast90 ?? []}
      payments={payments ?? []}
      stats={{ presentThisMonth, totalThisMonth, streak }}
    />
  );
}

export default function PortalClubPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PortalClubData clubSlug={params.clubSlug} />
    </Suspense>
  );
}
