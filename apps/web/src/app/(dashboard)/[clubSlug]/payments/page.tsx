// ─── Payments Page ────────────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/payments
//
// Two sections:
//   - Overdue: members with status overdue/expired, sorted by days overdue
//   - History: all payment records for this club, newest first (last 90 days)

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PaymentsClient } from "./_components/payments-client";
import type { MembershipStatus, PaymentMethod } from "@zenzo/database/enums";

export const metadata = { title: "Payments" };

interface Props {
  params: { clubSlug: string };
}

export default async function PaymentsPage({ params }: Props) {
  const { clubSlug } = params;
  const supabase = createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // ── Resolve club ─────────────────────────────────────────────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // ── Fetch overdue + expired memberships ──────────────────────────────────
  const { data: overdueRows } = await supabase
    .from("club_memberships")
    .select(
      "id, status, next_due_date, user_id, users(full_name, phone), fee_plans(name, amount_paise)"
    )
    .eq("club_id", club.id)
    .in("status", ["overdue", "expired"])
    .is("deleted_at", null)
    .order("next_due_date", { ascending: true });

  const overdueMembers = (overdueRows ?? []).map((m) => {
    const daysOverdue = m.next_due_date
      ? Math.max(
          0,
          Math.floor(
            (new Date(today).getTime() - new Date(m.next_due_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    return {
      membershipId:    m.id,
      userId:          m.user_id,
      fullName:        m.users?.full_name ?? "Unknown",
      phone:           m.users?.phone ?? "",
      status:          m.status as MembershipStatus,
      nextDueDate:     m.next_due_date,
      planName:        m.fee_plans?.name ?? null,
      planAmountPaise: m.fee_plans?.amount_paise ?? null,
      daysOverdue,
    };
  });

  // ── Fetch all membership IDs for this club (for payment filter) ─────────
  const { data: membershipIds } = await supabase
    .from("club_memberships")
    .select("id")
    .eq("club_id", club.id)
    .is("deleted_at", null);

  const idList = (membershipIds ?? []).map((m) => m.id);

  // ── Fetch payment history (last 90 days) ─────────────────────────────────
  const { data: paymentRows } =
    idList.length > 0
      ? await supabase
          .from("payments")
          .select(
            "id, amount_paise, method, payment_date, note, membership_id, club_memberships(user_id, users(full_name))"
          )
          .in("membership_id", idList)
          .gte("payment_date", ninetyDaysAgo)
          .order("payment_date", { ascending: false })
      : { data: [] };

  const paymentHistory = (paymentRows ?? []).map((p) => ({
    id:           p.id,
    amountPaise:  p.amount_paise,
    method:       p.method as PaymentMethod,
    date:         p.payment_date,
    note:         p.note ?? null,
    memberName:   p.club_memberships?.users?.full_name ?? "Unknown",
    memberUserId: p.club_memberships?.user_id ?? "",
  }));

  return (
    <PaymentsClient
      clubSlug={clubSlug}
      overdueMembers={overdueMembers}
      paymentHistory={paymentHistory}
    />
  );
}
