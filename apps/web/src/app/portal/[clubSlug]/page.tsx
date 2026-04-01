// /portal/[clubSlug] — member view of one club
//
// Server Component: fetches membership data + all-time attendance for achievements.
// Passes enriched data to PortalClubClient for tab rendering.

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipStatus, AttendanceStatus } from "@zenzo/database/enums";
import { PortalClubClient } from "./_components/portal-club-client";

interface Props {
  params: { clubSlug: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: `My Club · ${params.clubSlug}` };
}

function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-4">
      {/* Hero shimmer */}
      <div className="portal-shimmer h-6 w-32 rounded-lg" />
      <div className="portal-shimmer h-8 w-64 rounded-xl" />
      <div className="portal-shimmer h-4 w-48 rounded" />
      <div className="flex gap-6 mt-4">
        <div className="portal-shimmer size-[110px] rounded-full" />
        <div className="flex-1 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="portal-shimmer h-14 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="portal-shimmer h-10 w-full rounded-xl mt-4" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="portal-shimmer h-24 rounded-2xl" />
        <div className="portal-shimmer h-24 rounded-2xl" />
      </div>
      <div className="portal-shimmer h-32 rounded-2xl" />
    </div>
  );
}

async function PortalClubData({ clubSlug }: { clubSlug: string }) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // ── Resolve club ─────────────────────────────────────────────────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, phone")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // ── Membership for this user in this club ────────────────────────────────────
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

  // ── Fee plan ─────────────────────────────────────────────────────────────────
  const { data: feePlan } = membership.plan_id
    ? await supabase
        .from("fee_plans")
        .select("id, name, amount_paise, billing_cycle")
        .eq("id", membership.plan_id)
        .single()
    : { data: null };

  // ── Batches this member is in ─────────────────────────────────────────────────
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

  // ── Attendance this month ─────────────────────────────────────────────────────
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

  // ── Last 90 days attendance (for heatmap) ────────────────────────────────────
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: attendanceLast90 } = await supabase
    .from("attendance_records")
    .select("id, date, status, batch_id")
    .eq("membership_id", membership.id)
    .gte("date", ninetyDaysAgo)
    .order("date", { ascending: false });

  // ── All-time attendance (for achievements) ────────────────────────────────────
  const { data: allTimeAttendance } = await supabase
    .from("attendance_records")
    .select("date, status")
    .eq("membership_id", membership.id)
    .order("date", { ascending: true });

  const allRecords = allTimeAttendance ?? [];
  const totalPresentAllTime = allRecords.filter(
    (a) => a.status === AttendanceStatus.Present
  ).length;

  // Max consecutive streak all time
  let maxStreakAllTime = 0;
  let currentRun = 0;
  for (const r of allRecords) {
    if (r.status === AttendanceStatus.Present) {
      currentRun++;
      if (currentRun > maxStreakAllTime) maxStreakAllTime = currentRun;
    } else {
      currentRun = 0;
    }
  }

  // ── Payments ──────────────────────────────────────────────────────────────────
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount_paise, method, payment_date, reference, note")
    .eq("membership_id", membership.id)
    .order("payment_date", { ascending: false });

  // ── Attendance stats (this month + current streak) ────────────────────────────
  const presentThisMonth = (attendanceThisMonth ?? []).filter(
    (a) => a.status === AttendanceStatus.Present
  ).length;
  const totalThisMonth = (attendanceThisMonth ?? []).length;

  const sortedDesc = [...(attendanceLast90 ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let streak = 0;
  for (const record of sortedDesc) {
    if (record.status === AttendanceStatus.Present) {
      streak++;
    } else {
      break;
    }
  }

  // ── User profile (for Profile tab) ───────────────────────────────────────────
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

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
      allTimeStats={{ totalPresent: totalPresentAllTime, maxStreak: maxStreakAllTime }}
      userProfile={
        userProfile
          ? { full_name: userProfile.full_name, phone: userProfile.phone }
          : null
      }
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
