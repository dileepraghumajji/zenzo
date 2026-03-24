// Server-side auth utilities — used in layouts and server components only.
// Never import this file in client components ("use client").
//
// Call site:
//   [tenantSlug]/layout.tsx → getUserProfile(tenantSlug)
//     → passes {role, fullName, initials} as props to Sidebar + BottomNav
//
// Re-trigger:
//   Automatic: layout re-runs on every navigation (Next.js App Router)
//   Manual:    client calls router.refresh() after a role change
//
// Note on select(): use explicit column lists instead of "*".
// Supabase's type-level parser expands "*" only with auto-generated types.
// After running migrations: pnpm supabase gen types typescript --local
// → replace packages/database/src/types/index.ts → "select(*)" works too.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  role: "owner" | "staff" | "member";
  fullName: string;
  initials: string;
  tenantId: string;
}

// ─── getUserProfile ───────────────────────────────────────────────────────────
// Fetches role + display info for the authenticated user within a given tenant.
// Called ONCE per navigation in [tenantSlug]/layout.tsx.
// Result flows DOWN as props — pages and client components never call this.
//
// Redirect cases:
//   No session            → /login  (cookie expired)
//   No profile for tenant → /login  (user revoked, wrong tenant slug)

export async function getUserProfile(tenantSlug: string): Promise<UserProfile> {
  // Create the client directly so TypeScript preserves the full Database generic.
  // Destructuring from a helper loses the exact type — query results become never.
  const supabase = createSupabaseServerClient();

  // Validate session — getUser() hits the Supabase auth server (not just local cookie).
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // Fetch role + name. Explicit columns required until auto-generated types are in place.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");

  // Verify the tenant slug — prevents a user accessing another tenant by guessing slugs.
  const { error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", profile.tenant_id)
    .eq("slug", tenantSlug)
    .single();

  if (tenantError) redirect("/login");

  // Derive initials safely (noUncheckedIndexedAccess: true in tsconfig)
  const parts = (profile.full_name ?? "").trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last  = parts[parts.length - 1] ?? "";
  const initials =
    ((first[0] ?? "") + (last !== first ? (last[0] ?? "") : "")).toUpperCase() || "?";

  return {
    userId:   user.id,
    role:     profile.role,
    fullName: profile.full_name ?? "User",
    initials,
    tenantId: profile.tenant_id,
  };
}
