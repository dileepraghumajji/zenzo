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
import { InviteStatus, MembershipStatus } from "@zenzo/database/enums";
import { sendEmail, isNotifEnabled } from "@/lib/email";
import { reminderEmailHtml } from "@/lib/email-templates/reminder";
import { APP_URL } from "@/lib/constants";

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

  // ── Expire stale club_invites (pending + past expires_at) ─────────────────
  const { data: expiredInvites, error: e3 } = await supabase
    .from("club_invites")
    .update({ status: InviteStatus.Expired })
    .eq("status", InviteStatus.Pending)
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (e3) {
    console.error("[cron:expire-memberships] invite expiry failed:", e3);
    // Non-fatal — continue and still return membership results
  }

  // ── Send payment reminders for newly-overdue memberships ──────────────────
  if (toOverdue && toOverdue.length > 0) {
    await sendReminderEmails(supabase, toOverdue.map((r) => r.id));
  }

  console.info(
    `[cron:expire-memberships] ${toOverdue?.length ?? 0} → overdue, ${toExpired?.length ?? 0} → expired, ${expiredInvites?.length ?? 0} invites expired`
  );

  return NextResponse.json({
    ok:             true,
    overdue:        toOverdue?.length ?? 0,
    expired:        toExpired?.length ?? 0,
    invitesExpired: expiredInvites?.length ?? 0,
  });
}

// ─── Reminder email helper ────────────────────────────────────────────────────

type ServiceClient = ReturnType<typeof createClient<Database>>;

async function sendReminderEmails(
  supabase: ServiceClient,
  membershipIds: string[]
): Promise<void> {
  // Batch-fetch memberships + user + club + plan
  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("id, next_due_date, user_id, club_id, plan_id, fee_plans(name, amount_paise), users(email, full_name), clubs(name, slug, terminology)")
    .in("id", membershipIds);

  if (!memberships) return;

  await Promise.allSettled(
    memberships.map(async (mem) => {
      const user  = mem.users  as { email: string; full_name: string } | null;
      const club  = mem.clubs  as { name: string; slug: string; terminology: Record<string, unknown> } | null;
      const plan  = mem.fee_plans as { name: string; amount_paise: number } | null;

      if (!user || !club || !mem.next_due_date) return;

      if (!isNotifEnabled(club.terminology, "notif_payment_reminder")) return;

      await sendEmail({
        to: user.email,
        subject: `Your ${club.name} membership fee is overdue`,
        html: reminderEmailHtml({
          memberName:  user.full_name,
          clubName:    club.name,
          amountPaise: plan?.amount_paise ?? null,
          dueDate:     mem.next_due_date,
          portalUrl:   `${APP_URL}/portal/${club.slug}`,
        }),
      });
    })
  );
}
