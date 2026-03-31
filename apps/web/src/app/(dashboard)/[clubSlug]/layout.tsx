// ─── Club Dashboard Layout ────────────────────────────────────────────────────
//
// This is an async Server Component — it runs on the server on every navigation.
//
// Responsibility:
//   1. Fetch the authenticated user's profile for this club (role, name).
//   2. Pass role + display info as props to nav components.
//   3. Render the two-panel shell (sidebar | main | bottom-nav).
//
// getUserProfile() is called HERE and only here for the dashboard scope.
//   - Redirects to /login if session is invalid or user doesn't belong to club.
//   - Re-runs automatically on every Next.js navigation.
//   - After a role change, the owner calls router.refresh() → this layout re-runs.
//
// No Suspense for navigation: nav must render stable, not as a skeleton.
// Suspense + Skeleton is used by PAGES for their own slow data (member lists, etc.).

import * as React from "react";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { StaffRole } from "@zenzo/database/enums";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { clubSlug: string };
}) {
  const { clubSlug } = params;

  // Fetches profile from clubs + club_staff tables.
  // If session invalid or user not in this club → redirects to /login.
  const { role, fullName, initials } = await getUserProfile(clubSlug);

  // Only owner and coach can access the club dashboard.
  if (role !== StaffRole.Owner && role !== StaffRole.Coach) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — role determines which nav items are visible */}
      <Sidebar
        clubSlug={clubSlug}
        role={role}
        userName={fullName}
        userInitials={initials}
      />

      {/* Main content — flex-1 fills space left by sidebar */}
      <main className="flex-1 overflow-y-auto min-w-0 pb-14 lg:pb-0">
        {children}
      </main>

      {/* Mobile/tablet bottom nav — same role, same fetch */}
      <BottomNav clubSlug={clubSlug} role={role} />
    </div>
  );
}
