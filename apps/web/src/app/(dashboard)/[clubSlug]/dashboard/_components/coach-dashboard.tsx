// ─── CoachDashboard ───────────────────────────────────────────────────────────
//
// Server Component — rendered inside DashboardPage when role === 'coach'.
//
// Sections:
//   1. KPI row   — today's sessions / total members across coach's batches / attendance rate today
//   2. Today's sessions — each batch with Take Attendance CTA or present/absent summary
//   3. My Batches — all batches assigned to this coach

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Avatar, Badge } from "@zenzo/ui";
import { StatCard, SectionCard, EmptySection } from "./dashboard-ui";

const DAY_MAP: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

interface Props {
  clubId: string;
  clubSlug: string;
  userId: string;
  userName: string;
}

export async function CoachDashboard({ clubId, clubSlug, userId, userName }: Props) {
  const supabase = createSupabaseServerClient();

  const today    = new Date().toISOString().slice(0, 10);
  const todayDay = DAY_MAP[new Date().getDay()] ?? "mon";

  // ── 1. All batches assigned to this coach ─────────────────────────────────
  const { data: allBatches } = await supabase
    .from("batches")
    .select("id, name, start_time, end_time, days")
    .eq("club_id", clubId)
    .eq("coach_id", userId)
    .is("deleted_at", null)
    .order("start_time");

  const todayBatches = (allBatches ?? []).filter((b) =>
    (b.days as string[]).includes(todayDay)
  );
  const todayBatchIds = todayBatches.map((b) => b.id);

  // ── 2. Member counts per batch ────────────────────────────────────────────
  const allBatchIds = (allBatches ?? []).map((b) => b.id);

  const { data: memberBatchRows } =
    allBatchIds.length > 0
      ? await supabase
          .from("member_batches")
          .select("batch_id, membership_id")
          .in("batch_id", allBatchIds)
      : { data: [] };

  const memberCountByBatch = new Map<string, number>();
  for (const r of memberBatchRows ?? []) {
    memberCountByBatch.set(
      r.batch_id,
      (memberCountByBatch.get(r.batch_id) ?? 0) + 1
    );
  }

  const totalMembers = new Set(
    (memberBatchRows ?? []).map((r) => r.membership_id)
  ).size;

  // ── 3. Today's attendance records ─────────────────────────────────────────
  const { data: todayAttendance } =
    todayBatchIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("batch_id, status")
          .eq("date", today)
          .in("batch_id", todayBatchIds)
      : { data: [] };

  const attendanceByBatch = new Map<string, { present: number; total: number }>();
  for (const r of todayAttendance ?? []) {
    const entry = attendanceByBatch.get(r.batch_id) ?? { present: 0, total: 0 };
    entry.total++;
    if (r.status === "present") entry.present++;
    attendanceByBatch.set(r.batch_id, entry);
  }

  const totalPresent = Array.from(attendanceByBatch.values()).reduce(
    (s, v) => s + v.present,
    0
  );
  const totalMarked = Array.from(attendanceByBatch.values()).reduce(
    (s, v) => s + v.total,
    0
  );
  const attendanceRate =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : null;

  const sessionsMarked = Array.from(attendanceByBatch.keys()).length;

  // ── Render ────────────────────────────────────────────────────────────────
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="text-[24px] font-bold text-foreground">
          Good {getTimeOfDay()}, {firstName} 👋
        </h1>
        <p className="text-[13px] text-muted mt-0.5">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Today's Sessions"
          value={todayBatches.length}
          sub={`${sessionsMarked} marked`}
          accent={todayBatches.length > 0 ? "default" : "default"}
        />
        <StatCard
          label="My Members"
          value={totalMembers}
          sub="across all batches"
        />
        <StatCard
          label="Attendance Today"
          value={attendanceRate !== null ? `${attendanceRate}%` : "—"}
          sub={totalMarked > 0 ? `${totalPresent}/${totalMarked} present` : "Not taken yet"}
          accent={
            attendanceRate === null
              ? "default"
              : attendanceRate >= 75
              ? "success"
              : "warning"
          }
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* ── Today's Sessions ─────────────────────────────────────────────── */}
      <SectionCard
        title="Today's Sessions"
        action={
          <Link
            href={`/${clubSlug}/attendance/history`}
            className="text-primary hover:underline"
          >
            History →
          </Link>
        }
      >
        {todayBatches.length === 0 ? (
          <EmptySection message="No sessions scheduled for today." />
        ) : (
          <div className="divide-y divide-border">
            {todayBatches.map((b) => {
              const att = attendanceByBatch.get(b.id);
              const memberCount = memberCountByBatch.get(b.id) ?? 0;
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between px-4 py-4"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">
                      {b.name}
                    </p>
                    <p className="text-[12px] text-muted">
                      {b.start_time} — {b.end_time} · {memberCount} members
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {att ? (
                      <>
                        <Badge
                          variant="success"
                          label={`${att.present} present`}
                          size="sm"
                        />
                        <Link
                          href={`/${clubSlug}/attendance/take/${b.id}`}
                          className="text-[12px] text-muted hover:text-foreground underline"
                        >
                          Edit
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/${clubSlug}/attendance/take/${b.id}`}
                        className="inline-flex items-center rounded-lg bg-primary text-white text-[13px] font-medium px-3 py-1.5 hover:bg-primary/90 transition-colors"
                      >
                        Take Attendance
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── All My Batches ───────────────────────────────────────────────── */}
      {(allBatches ?? []).length > todayBatches.length && (
        <SectionCard
          title="All My Batches"
          action={
            <Link
              href={`/${clubSlug}/batches`}
              className="text-primary hover:underline"
            >
              View all →
            </Link>
          }
        >
          <div className="divide-y divide-border">
            {(allBatches ?? [])
              .filter((b) => !(b.days as string[]).includes(todayDay))
              .map((b) => {
                const memberCount = memberCountByBatch.get(b.id) ?? 0;
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-foreground">
                        {b.name}
                      </p>
                      <p className="text-[12px] text-muted">
                        {(b.days as string[])
                          .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                          .join(", ")}{" "}
                        · {b.start_time}
                      </p>
                    </div>
                    <p className="text-[12px] text-muted shrink-0 ml-3">
                      {memberCount} members
                    </p>
                  </div>
                );
              })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
