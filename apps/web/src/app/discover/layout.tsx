import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/portal-theme-toggle";
import { ConsumerNav } from "@/components/consumer-nav";

export default async function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { count: membershipCount }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).single(),
    supabase
      .from("club_memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "deleted"),
  ]);

  const initials = (profile?.full_name ?? user.email ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const homeHref = (membershipCount ?? 0) > 0 ? "/portal" : "/discover";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-surface-subtle border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={homeHref}>
            <span className="text-h2 font-bold tracking-tight text-brand">zenzo</span>
          </Link>

          <ConsumerNav homeHref={homeHref} />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/profile"
              className="size-9 rounded-full bg-primary flex items-center justify-center text-caption font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-16 md:pb-0">{children}</main>
    </div>
  );
}
