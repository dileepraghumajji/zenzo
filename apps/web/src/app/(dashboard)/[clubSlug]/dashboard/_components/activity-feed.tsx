// ─── ActivityFeed ──────────────────────────────────────────────────────────────
//
// Server Component — shows the last 10 events across the club:
//   - Recent payments (latest 5 from the payments table)
//   - Today's absent attendance records (up to 5)
//
// Events are merged, sorted newest-first, and rendered as a timeline list.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@zenzo/utils";
import { SectionCard, EmptySection } from "./dashboard-ui";

interface Props {
  clubId: string;
  membershipIds: string[];
  todayBatchIds: string[];
  today: string;
}

type FeedEvent =
  | { kind: "payment"; name: string; amountPaise: number; time: string }
  | { kind: "absent";  name: string; batchName: string; time: string };

function timeAgo(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr  < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function ActivityFeed({
  clubId: _clubId,
  membershipIds,
  todayBatchIds,
  today,
}: Props) {
  const supabase = createSupabaseServerClient();
  const events: FeedEvent[] = [];

  // ── Recent payments ────────────────────────────────────────────────────────
  if (membershipIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount_paise, payment_date, membership_id, club_memberships(user_id, users(full_name))")
      .in("membership_id", membershipIds)
      .order("payment_date", { ascending: false })
      .limit(5);

    for (const p of payments ?? []) {
      events.push({
        kind:        "payment",
        name:        p.club_memberships?.users?.full_name ?? "Unknown",
        amountPaise: p.amount_paise,
        time:        p.payment_date,
      });
    }
  }

  // ── Today's absent records ─────────────────────────────────────────────────
  if (todayBatchIds.length > 0) {
    const { data: absents } = await supabase
      .from("attendance_records")
      .select("id, date, membership_id, batch_id, batches(name), club_memberships(users(full_name))")
      .eq("date", today)
      .eq("status", "absent")
      .in("batch_id", todayBatchIds)
      .limit(5);

    for (const a of absents ?? []) {
      events.push({
        kind:      "absent",
        name:      a.club_memberships?.users?.full_name ?? "Unknown",
        batchName: a.batches?.name ?? "Batch",
        time:      a.date + "T00:00:00.000Z",
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const feed = events.slice(0, 10);

  return (
    <SectionCard title="Recent Activity" className="lg:col-span-2">
      {feed.length === 0 ? (
        <EmptySection message="No recent activity." />
      ) : (
        <div className="divide-y divide-border">
          {feed.map((ev, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={
                    ev.kind === "payment"
                      ? "text-[18px]"
                      : "text-[18px]"
                  }
                  aria-hidden
                >
                  {ev.kind === "payment" ? "💳" : "❌"}
                </span>
                <p className="text-[13px] text-foreground truncate">
                  {ev.kind === "payment" ? (
                    <>
                      <span className="font-medium">{ev.name}</span>
                      {" paid "}
                      <span className="font-mono">{formatCurrency(ev.amountPaise)}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{ev.name}</span>
                      {" absent · "}
                      <span className="text-muted">{ev.batchName}</span>
                    </>
                  )}
                </p>
              </div>
              <p className="text-[11px] text-muted shrink-0 ml-3 font-mono">
                {timeAgo(ev.time)}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
