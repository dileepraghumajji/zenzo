// ─── Members Page ──────────────────────────────────────────────────────────────
//
// Layer 3: Page (Server Component)
// Role + clubSlug come from the layout — this page fetches its own data.
//
// Structure:
//   PageHeader   — renders immediately (title + invite CTA)
//   <Suspense>   — shows MemberListSkeleton while MembersLoader fetches data
//     MembersLoader — async SC, two DB queries, passes MemberRow[] to client

import * as React from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@zenzo/ui";
import { MembersLoader } from "./_components/members-loader";
import { MemberListSkeleton } from "./_components/members-client";

export const metadata = { title: "Members" };

export default function MembersPage({
  params,
}: {
  params: { clubSlug: string };
}) {
  const { clubSlug } = params;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold text-foreground leading-tight">
          Members
        </h1>
        <Link href={`/${clubSlug}/members/invite`}>
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      {/* ── Member list with Suspense skeleton ──────────────────────────────── */}
      <React.Suspense fallback={<MemberListSkeleton />}>
        <MembersLoader clubSlug={clubSlug} />
      </React.Suspense>

    </div>
  );
}
