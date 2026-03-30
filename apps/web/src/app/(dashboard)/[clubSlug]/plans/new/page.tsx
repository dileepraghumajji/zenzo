// ─── New Fee Plan Page ───────────────────────────────────────────────────────
//
// Thin wrapper around PlanForm.

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PlanForm } from "../_components/plan-form";

export const metadata = { title: "Create Fee Plan" };

interface Props {
  params: { clubSlug: string };
}

export default function NewPlanPage({ params }: Props) {
  const { clubSlug } = params;

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
        Create Fee Plan
      </h1>

      <PlanForm clubSlug={clubSlug} />
    </div>
  );
}
