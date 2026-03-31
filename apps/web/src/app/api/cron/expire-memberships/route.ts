// GET /api/cron/expire-memberships
//
// Vercel Cron job — runs daily at 00:30 IST (19:00 UTC).
// Configured in vercel.json.
//
// Transitions:
//   active  → overdue  when next_due_date < today
//   overdue → expired  when next_due_date < today - 30 days
//
// Secured via CRON_SECRET env var (set in Vercel dashboard).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@zenzo/database";
import { MembershipStatus } from "@zenzo/database/enums";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service-role client so RLS doesn't block batch updates
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today        = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // ── active → overdue (next_due_date is in the past) ────────────────────────
  const { data: toOverdue, error: e1 } = await supabase
    .from("club_memberships")
    .update({ status: MembershipStatus.Overdue })
    .eq("status", MembershipStatus.Active)
    .lt("next_due_date", today)
    .not("next_due_date", "is", null)
    .is("deleted_at", null)
    .select("id");

  if (e1) {
    console.error("[cron:expire-memberships] overdue update failed:", e1);
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }

  // ── overdue → expired (past overdue for 30+ days) ────────────────────────
  const { data: toExpired, error: e2 } = await supabase
    .from("club_memberships")
    .update({ status: MembershipStatus.Expired })
    .eq("status", MembershipStatus.Overdue)
    .lt("next_due_date", thirtyDaysAgo)
    .not("next_due_date", "is", null)
    .is("deleted_at", null)
    .select("id");

  if (e2) {
    console.error("[cron:expire-memberships] expired update failed:", e2);
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  console.info(
    `[cron:expire-memberships] ${toOverdue?.length ?? 0} → overdue, ${toExpired?.length ?? 0} → expired`
  );

  return NextResponse.json({
    ok:      true,
    overdue: toOverdue?.length ?? 0,
    expired: toExpired?.length ?? 0,
  });
}
