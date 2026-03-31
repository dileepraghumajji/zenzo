// ─── Edit Fee Plan Page ──────────────────────────────────────────────────────
//
// Fetches the plan and passes it to PlanForm for editing.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlanForm } from "../_components/plan-form";
import { BillingCycle } from "@zenzo/database/enums";

export const metadata = { title: "Edit Fee Plan" };

interface Props {
  params: { clubSlug: string; planId: string };
}

export default async function EditPlanPage({ params }: Props) {
  const { clubSlug, planId } = params;
  const supabase = createSupabaseServerClient();

  // ── 1. Resolve club to ensure it belongs to the URL slug ───────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // ── 2. Fetch the plan ──────────────────────────────────────────────────────
  const { data: plan, error } = await supabase
    .from("fee_plans")
    .select("id, name, amount_paise, billing_cycle")
    .eq("id", planId)
    .eq("club_id", club.id)
    .single();

  if (error || !plan) notFound();

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-xl mx-auto">
      {/* Back link */}
      <Link
        href={`/${clubSlug}/plans`}
        className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Plans
      </Link>

      <h1 className="text-[24px] font-bold text-foreground leading-tight mb-8">
        Edit Fee Plan
      </h1>

      <PlanForm 
        clubSlug={clubSlug} 
        initialData={{
          ...plan,
          billing_cycle: plan.billing_cycle as BillingCycle
        }} 
      />
    </div>
  );
}
