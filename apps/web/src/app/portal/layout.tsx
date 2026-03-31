// /portal layout
//
// Auth guard: redirects unauthenticated users to /login.
// Minimal top bar — no sidebar, no club context.
// Used by members and new users (no club_staff relationship).

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch name for the top bar
  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const initials = (profile?.full_name ?? user.email ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-surface-raised border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-[20px] font-bold tracking-tight text-brand">
            zenzo
          </span>
          <div
            className="size-8 rounded-full bg-primary-subtle flex items-center justify-center text-caption font-semibold text-brand"
            aria-hidden="true"
          >
            {initials}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
