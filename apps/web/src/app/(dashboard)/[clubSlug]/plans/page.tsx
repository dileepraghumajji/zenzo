// ─── Plans Page ─────────────────────────────────────────────────────────────
//
// Layer 3: Server Component — fetches all fee plans for the club.
// Wrapper around PlansLoader to support search/filter if needed later.

import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@zenzo/ui";
import { PlansLoader } from "./_components/plans-loader";
import { PlanListSkeleton } from "./_components/plans-client";

export const metadata = { title: "Fee Plans" };

interface Props {
  params: { clubSlug: string };
}

export default function PlansPage({ params }: Props) {
  const { clubSlug } = params;

  return (
    <div className="px-4 py-8 lg:px-10 lg:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-heading leading-tight mb-2">
            Fee Plans
          </h1>
          <p className="text-[14px] text-muted">
            Manage your club's subscription plans and fees.
          </p>
        </div>

        <Link href={`/${clubSlug}/plans/new`}>
          <Button variant="primary" icon={<Plus className="size-4" />}>
            Create Plan
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Suspense fallback={<PlanListSkeleton />}>
        <PlansLoader clubSlug={clubSlug} />
      </Suspense>
    </div>
  );
}
