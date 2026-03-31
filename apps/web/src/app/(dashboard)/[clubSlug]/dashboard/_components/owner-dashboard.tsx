// ─── OwnerDashboard ───────────────────────────────────────────────────────────
//
// Server Component — rendered inside DashboardPage when role === 'owner'.
//
// Sections:
//   1. KPI row   — active members / overdue / month revenue / batch count
//   2. Overdue   — top 5 members with overdue fees
//   3. Today     — batches scheduled today with attendance status
//   4. Payments  — last 5 payments recorded

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipStatus } from "@zenzo/database/enums";
import { formatCurrency, formatDate } from "@zenzo/utils";
import { Avatar, Badge } from "@zenzo/ui";
import { StatCard, SectionCard, EmptySection } from "./dashboard-ui";

const DAY_MAP: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

interface Props {
  clubId: string;
  clubSlug: string;
  userName: string;
}

export async function OwnerDashboard({ clubId, clubSlug, userName }: Props) {
  const supabase = createSupabaseServerClient();

  const today      = new Date().toISOString().slice(0, 10);
  const todayDay   = DAY_MAP[new Date().getDay()] ?? "mon";
  const monthStart = today.slice(0, 7) + "-01";

  // ── 1. Member counts ──────────────────────────────────────────────────────
  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("id, status, next_due_date, user_id, users(full_name, phone), fee_plans(name, amount_paise)")
    .eq("club_id", clubId)
    .is("deleted_at", null)
    .in("status", [
      MembershipStatus.Active,
      MembershipStatus.Overdue,
      MembershipStatus.Expired,
    ]);

  const allRows       = memberships ?? [];
  const activeCount   = allRows.filter((m) => m.status === MembershipStatus.Active).length;
  const overdueRows   = allRows
    .filter((m) => m.status === MembershipStatus.Overdue || m.status === MembershipStatus.Expired)
    .sort((a, b) => {
      const da = a.next_due_date ? new Date(a.next_due_date).getTime() : 0;
      const db = b.next_due_date ? new Date(b.next_due_date).getTime() : 0;
      return da - db;
    });

  // ── 2. This month's revenue ───────────────────────────────────────────────
  const membershipIds = allRows.map((m) => m.id);
  const { data: monthPayments } =
    membershipIds.length > 0
      ? await supabase
          .from("payments")
          .select("id, amount_paise, method, payment_date, membership_id, club_memberships(user_id, users(full_name))")
          .in("membership_id", membershipIds)
          .gte("payment_date", monthStart)
          .order("payment_date", { ascending: false })
      : { data: [] };

  const monthRevenuePaise = (monthPayments ?? []).reduce(
    (sum, p) => sum + p.amount_paise,
    0
  );
  const recentPayments = (monthPayments ?? []).slice(0, 5);

  // ── 3. Batches + today's attendance ───────────────────────────────────────
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, start_time, days")
    .eq("club_id", clubId)
    .is("deleted_at", null)
    .contains("days", [todayDay]);

  const todayBatchIds = (batches ?? []).map((b) => b.id);

  const { data: todayAttendance } =
    todayBatchIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("batch_id, status")
          .eq("date", today)
          .in("batch_id", todayBatchIds)
      : { data: [] };

  // Group attendance counts per batch
  const attendanceByBatch = new Map<string, { present: number; total: number }>();
  for (const r of todayAttendance ?? []) {
    const entry = attendanceByBatch.get(r.batch_id) ?? { present: 0, total: 0 };
    entry.total++;
    if (r.status === "present") entry.present++;
    attendanceByBatch.set(r.batch_id, entry);
  }

  const batchCount = (
    await supabase
      .from("batches")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .is("deleted_at", null)
  ).count ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-8">

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Members"
          value={activeCount}
          accent="success"
        />
        <StatCard
          label="Overdue"
          value={overdueRows.length}
          accent={overdueRows.length > 0 ? "error" : "default"}
          action={
            overdueRows.length > 0 ? (
              <Link
                href={`/${clubSlug}/payments`}
                className="text-[12px] text-primary hover:underline"
              >
                View all →
              </Link>
            ) : undefined
          }
        />
        <StatCard
          label="Revenue (This Month)"
          value={formatCurrency(monthRevenuePaise)}
          accent="success"
        />
        <StatCard
          label="Batches"
          value={batchCount}
          sub={`${(batches ?? []).length} today`}
        />
      </div>

      {/* ── Two-column section grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Batches */}
        <SectionCard
          title="Today's Sessions"
          action={
            <Link
              href={`/${clubSlug}/batches`}
              className="text-primary hover:underline"
            >
              All batches →
            </Link>
          }
        >
          {(batches ?? []).length === 0 ? (
            <EmptySection message="No batches scheduled today." />
          ) : (
            <div className="divide-y divide-border">
              {(batches ?? []).map((b) => {
                const att = attendanceByBatch.get(b.id);
                const taken = !!att;
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-foreground">
                        {b.name}
                      </p>
                      <p className="text-[12px] text-muted">{b.start_time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {taken ? (
                        <Badge
                          variant="success"
                          label={`${att.present}/${att.total}`}
                          size="sm"
                        />
                      ) : (
                        <Link
                          href={`/${clubSlug}/attendance/take/${b.id}`}
                          className="text-[12px] font-medium text-primary hover:underline"
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

        {/* Overdue Members */}
        <SectionCard
          title="Overdue Members"
          action={
            overdueRows.length > 0 ? (
              <Link
                href={`/${clubSlug}/payments`}
                className="text-primary hover:underline"
              >
                View all →
              </Link>
            ) : undefined
          }
        >
          {overdueRows.length === 0 ? (
            <EmptySection message="No overdue members. 🎉" />
          ) : (
            <div className="divide-y divide-border">
              {overdueRows.slice(0, 5).map((m) => {
                const daysOverdue = m.next_due_date
                  ? Math.max(
                      0,
                      Math.floor(
                        (Date.now() - new Date(m.next_due_date).getTime()) /
                          86400000
                      )
                    )
                  : 0;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={m.users?.full_name ?? "?"} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/${clubSlug}/members/${m.user_id}`}
                          className="text-[13px] font-medium text-foreground hover:underline truncate block"
                        >
                          {m.users?.full_name ?? "Unknown"}
                        </Link>
                        <p className="text-[12px] text-muted">
                          {m.fee_plans?.name ?? "No plan"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {m.fee_plans?.amount_paise != null && (
                        <p className="text-[13px] font-mono font-medium text-foreground">
                          {formatCurrency(m.fee_plans.amount_paise)}
                        </p>
                      )}
                      <p className="text-[11px] text-error-foreground">
                        {daysOverdue}d overdue
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Recent Payments */}
        <SectionCard
          title="Recent Payments"
          action={
            <Link
              href={`/${clubSlug}/payments?tab=history`}
              className="text-primary hover:underline"
            >
              View all →
            </Link>
          }
          className="lg:col-span-2"
        >
          {recentPayments.length === 0 ? (
            <EmptySection message="No payments recorded this month." />
          ) : (
            <div className="divide-y divide-border">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={p.club_memberships?.users?.full_name ?? "?"}
                      size="sm"
                    />
                    <div>
                      <Link
                        href={`/${clubSlug}/members/${p.club_memberships?.user_id}`}
                        className="text-[13px] font-medium text-foreground hover:underline"
                      >
                        {p.club_memberships?.users?.full_name ?? "Unknown"}
                      </Link>
                      <p className="text-[12px] text-muted capitalize">
                        {p.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-mono font-medium text-foreground">
                      {formatCurrency(p.amount_paise)}
                    </p>
                    <p className="text-[12px] text-muted">
                      {formatDate(p.payment_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
