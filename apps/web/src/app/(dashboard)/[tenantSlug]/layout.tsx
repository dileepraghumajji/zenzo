// ─── Tenant Dashboard Layout ──────────────────────────────────────────────────
//
// This is an async Server Component — it runs on the server on every navigation.
//
// Responsibility:
//   1. Fetch the authenticated user's profile for this tenant (role, name).
//   2. Pass role + display info as props to nav components.
//   3. Render the two-panel shell (sidebar | main | bottom-nav).
//
// getUserProfile() is called HERE and only here for the dashboard scope.
//   - Redirects to /login if session is invalid or user doesn't belong to tenant.
//   - Re-runs automatically on every Next.js navigation.
//   - After a role change, the owner calls router.refresh() → this layout re-runs.
//
// No Suspense for navigation: nav must render stable, not as a skeleton.
// Suspense + Skeleton is used by PAGES for their own slow data (member lists, etc.).

import * as React from "react";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { UserRole } from "@zenzo/database/enums";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const { tenantSlug } = params;

  // Two DB queries (profile + tenant verification). Result flows down as props.
  // If session invalid or user not in this tenant → redirects to /login.
  const { role, fullName, initials } = await getUserProfile(tenantSlug);

  // Members use the member portal (/m/:token), not this dashboard.
  // If a member account somehow lands here, send them to the portal root.
  if (role === UserRole.Member) redirect(`/m`);

  // Narrow type: at this point role is guaranteed "owner" | "staff"
  const dashboardRole = role as "owner" | "staff";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — role determines which nav items are visible */}
      <Sidebar
        tenantSlug={tenantSlug}
        role={dashboardRole}
        userName={fullName}
        userInitials={initials}
      />

      {/* Main content — flex-1 fills space left by sidebar */}
      <main className="flex-1 overflow-y-auto min-w-0 pb-14 lg:pb-0">
        {children}
      </main>

      {/* Mobile/tablet bottom nav — same role, same fetch */}
      <BottomNav tenantSlug={tenantSlug} role={dashboardRole} />
    </div>
  );
}
