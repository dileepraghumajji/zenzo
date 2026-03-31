// ─── PlansLoader ────────────────────────────────────────────────────────────
//
// Async Server Component — fetches all fee plans for the club.
// Runs inside <Suspense> so PlanListSkeleton shows while loading.
//
// Two-query strategy:
//   1. clubs → resolve id
//   2. fee_plans → get plans
//   3. club_memberships → active members count per plan

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlansClient } from "./plans-client";
import type { PlanRow } from "./plans-client";
import { BillingCycle, MembershipStatus } from "@zenzo/database/enums";

interface Props {
  clubSlug: string;
}

export async function PlansLoader({ clubSlug }: Props) {
  const supabase = createSupabaseServerClient();

  // ── 1. Resolve club id ───────────────────────────────────────────────────
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) notFound();

  // ── 2. Fetch fee plans ───────────────────────────────────────────────────
  const { data: plans } = await supabase
    .from("fee_plans")
    .select("id, name, amount_paise, billing_cycle")
    .eq("club_id", club.id)
    .order("amount_paise");

  if (!plans || plans.length === 0) {
    return <PlansClient plans={[]} clubSlug={clubSlug} />;
  }

  // ── 3. Member counts per plan ─────────────────────────────────────────────
  const planIds = plans.map((p) => p.id);

  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("plan_id")
    .eq("club_id", club.id)
    .eq("status", MembershipStatus.Active)
    .in("plan_id", planIds);

  const memberCountMap = new Map<string, number>();
  for (const m of memberships ?? []) {
    if (m.plan_id) {
      memberCountMap.set(m.plan_id, (memberCountMap.get(m.plan_id) ?? 0) + 1);
    }
  }

  // ── 4. Map to PlanRow ─────────────────────────────────────────────────────
  const rows: PlanRow[] = plans.map((p) => ({
    id:            p.id,
    name:          p.name,
    amountPaise:   p.amount_paise,
    billingCycle:  p.billing_cycle as BillingCycle,
    memberCount:   memberCountMap.get(p.id) ?? 0,
  }));

  return <PlansClient plans={rows} clubSlug={clubSlug} />;
}
