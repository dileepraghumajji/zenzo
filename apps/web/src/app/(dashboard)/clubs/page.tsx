import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Building2, ChevronRight, Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Select Club | Zenzo",
};

export default async function ClubsPickerPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: staff } = await supabase
    .from("club_staff")
    .select("role, club_id")
    .eq("user_id", user.id);

  if (!staff || staff.length === 0) redirect("/onboarding");

  const clubIds = staff.map((s) => s.club_id);

  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, slug, name, city")
    .in("id", clubIds)
    .order("name");

  if (!clubs || clubs.length === 0) redirect("/onboarding");

  // Format array
  const userClubs = clubs.map((club) => {
    const s = staff.find((x) => x.club_id === club.id);
    return {
      ...club,
      role: s?.role || "coach",
    };
  });

  return (
    <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">
      {/* Background Glow */}
      <div
        className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
        style={{ background: "var(--auth-glow)" }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl">
        <div className="mb-10 text-center space-y-3">
          <h1 className="text-display text-heading">Welcome back</h1>
          <p className="text-body text-muted">
            Select a club to open its dashboard.
          </p>
        </div>

        <div className="grid gap-4">
          {userClubs.map((club) => (
            <Link
              key={club.id}
              href={`/${club.slug}/dashboard`}
              className="group block bg-surface-raised border border-border hover:border-brand/40 hover:shadow-sm rounded-xl p-5 transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-lg bg-surface-elevated flex items-center justify-center border border-border group-hover:bg-primary-subtle group-hover:border-brand/30 transition-colors">
                    <Building2 className="size-5 text-muted group-hover:text-brand transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-h4 text-heading font-medium">
                      {club.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-caption text-muted capitalize">
                        {club.role}
                      </span>
                      {club.city && (
                        <>
                          <span className="text-muted/50 text-[10px]">•</span>
                          <span className="text-caption text-muted truncate max-w-[120px]">
                            {club.city}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="size-8 rounded-full flex items-center justify-center text-muted group-hover:text-brand group-hover:bg-primary-subtle transition-colors">
                  <ChevronRight className="size-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Create new club */}
        <Link
          href="/onboarding/new-club"
          className="group flex items-center gap-4 bg-surface-raised border border-dashed border-border hover:border-brand/40 hover:bg-surface-subtle rounded-xl p-5 transition-all duration-standard"
        >
          <div className="size-12 rounded-lg border border-dashed border-border flex items-center justify-center group-hover:border-brand/40 group-hover:bg-primary-subtle transition-colors">
            <Plus className="size-5 text-muted group-hover:text-brand transition-colors" />
          </div>
          <div>
            <p className="text-h4 text-heading font-medium">Create another club</p>
            <p className="text-caption text-muted mt-0.5">Add a new branch or studio</p>
          </div>
        </Link>

        <div className="mt-8 flex justify-center">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-body-sm text-muted hover:text-foreground transition-colors p-2"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
