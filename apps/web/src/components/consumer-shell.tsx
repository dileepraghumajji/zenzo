import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConsumerHeader } from "./consumer-header";
import { ConsumerNav } from "./consumer-nav";

interface ConsumerShellProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export async function ConsumerShell({
  children,
  requireAuth = true,
}: ConsumerShellProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (requireAuth && !user) redirect("/login");

  let userData = null;
  let homeHref = "/discover";

  if (user) {
    const [{ data: profile }, { count: membershipCount }, { data: staffRow }] =
      await Promise.all([
        supabase
          .from("users")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("club_memberships")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "deleted"),
        supabase
          .from("club_staff")
          .select("clubs(slug)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),
      ]);

    const initials = (profile?.full_name ?? user.email ?? "?")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    homeHref = (membershipCount ?? 0) > 0 ? "/portal" : "/discover";
    const clubSlug =
      staffRow && "clubs" in staffRow && staffRow.clubs
        ? (staffRow.clubs as { slug: string }).slug
        : null;

    userData = {
      initials,
      avatarUrl: profile?.avatar_url ?? null,
      fullName: profile?.full_name ?? null,
      hasClub: !!clubSlug,
      clubSlug,
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <ConsumerHeader homeHref={homeHref} user={userData} />
      {user && <ConsumerNav homeHref={homeHref} />}
      <main className={user ? "pb-16 md:pb-0" : ""}>{children}</main>
    </div>
  );
}
