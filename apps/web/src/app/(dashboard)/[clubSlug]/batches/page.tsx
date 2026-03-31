// ─── Batches List Page ──────────────────────────────────────────────────────
//
// Layer 3: Server Component shell.
// Data fetch lives in BatchesLoader to enable Suspense + skeleton.

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@zenzo/ui";
import { BatchesLoader } from "./_components/batches-loader";
import { BatchListSkeleton } from "./_components/batches-client";

export const metadata = { title: "Batches" };

interface Props {
  params: { clubSlug: string };
}

export default function BatchesPage({ params }: Props) {
  const { clubSlug } = params;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-foreground leading-tight">
          Batches
        </h1>
        <Link href={`/${clubSlug}/batches/new`}>
          <Button variant="primary" icon={<Plus className="size-4" />}>
            Create Batch
          </Button>
        </Link>
      </div>

      {/* ── Batch grid ───────────────────────────────────────────────────────── */}
      <React.Suspense fallback={<BatchListSkeleton />}>
        <BatchesLoader clubSlug={clubSlug} />
      </React.Suspense>

    </div>
  );
}
