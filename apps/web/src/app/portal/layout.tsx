// /portal layout — consumer shell
//
// No hardcoded theme — inherits from next-themes (system/light/dark).
// ThemeToggle in the header lets users switch explicitly.

import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/portal-theme-toggle";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-surface-subtle border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/portal">
            <span className="text-h2 font-bold tracking-tight text-brand">zenzo</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              href="/portal/invites"
              className="size-9 rounded-full bg-surface-raised flex items-center justify-center hover:bg-border transition-colors"
            >
              <Bell className="size-4 text-muted" />
            </Link>

            <div className="size-9 rounded-full bg-primary flex items-center justify-center text-caption font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
