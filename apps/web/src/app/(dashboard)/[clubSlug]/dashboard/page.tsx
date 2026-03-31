// ─── Dashboard Page ───────────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/dashboard
//
// Reads the authenticated user's role from getUserProfile() and renders the
// appropriate view — OwnerDashboard or CoachDashboard — each in its own
// async Server Component wrapped in Suspense for incremental loading.

import { Suspense } from "react";
import { getUserProfile } from "@/lib/auth";
import { StaffRole } from "@zenzo/database/enums";
import { OwnerDashboard } from "./_components/owner-dashboard";
import { CoachDashboard } from "./_components/coach-dashboard";
import { DashboardSkeleton } from "./_components/dashboard-ui";

export const metadata = { title: "Dashboard" };

interface Props {
  params: { clubSlug: string };
}

export default async function DashboardPage({ params }: Props) {
  const { clubSlug } = params;
  const { role, userId, fullName, clubId } = await getUserProfile(clubSlug);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {role === StaffRole.Owner ? (
        <OwnerDashboard
          clubId={clubId}
          clubSlug={clubSlug}
          userName={fullName}
        />
      ) : (
        <CoachDashboard
          clubId={clubId}
          clubSlug={clubSlug}
          userId={userId}
          userName={fullName}
        />
      )}
    </Suspense>
  );
}
