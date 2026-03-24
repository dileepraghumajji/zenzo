// Server component — fetches user profile and passes role to the Sidebar client component.
// This runs on the server so the sidebar renders with correct nav items immediately on hydration.
// During streaming, SidebarSkeleton is shown via Suspense in the layout.

import { Sidebar } from "./sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  role: "owner" | "staff";
  userName: string;
  userInitials: string;
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────
// TODO (P0.1 — Auth): replace stub with real Supabase session + profile fetch.
//
// async function getUserProfile(tenantSlug: string): Promise<UserProfile> {
//   const supabase = createSupabaseServerClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) redirect("/login");
//   const { data: profile } = await supabase
//     .from("profiles")
//     .select("role, full_name")
//     .eq("user_id", user.id)
//     .eq("tenant_slug", tenantSlug)
//     .single();
//   const parts = (profile?.full_name ?? "").split(" ");
//   const first = parts[0] ?? "";
//   const last = parts[parts.length - 1] ?? "";
//   return {
//     role: profile?.role ?? "staff",
//     userName: profile?.full_name ?? "User",
//     userInitials: ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() || "U",
//   };
// }

async function getUserProfile(_tenantSlug: string): Promise<UserProfile> {
  // Stub: returns owner until auth is wired up in P0.1
  return {
    role: "owner",
    userName: "Owner",
    userInitials: "OW",
  };
}

// ─── SidebarServer ────────────────────────────────────────────────────────────

export async function SidebarServer({ tenantSlug }: { tenantSlug: string }) {
  const { role, userName, userInitials } = await getUserProfile(tenantSlug);

  return (
    <Sidebar
      tenantSlug={tenantSlug}
      role={role}
      userName={userName}
      userInitials={userInitials}
    />
  );
}
