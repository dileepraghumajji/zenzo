// /portal — member home
//
// Dark consumer experience: greeting, rich club cards, urgency indicators.
// All colours from semantic tokens — .dark class set by layout.

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus, Search, Compass, ChevronRight, Clock } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@zenzo/utils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PortalSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton-shimmer h-7 w-44 rounded-lg" />
      <div className="skeleton-shimmer h-4 w-32 rounded" />
      <div className="space-y-3 mt-6">
        <div className="skeleton-shimmer h-3 w-16 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="skeleton-shimmer rounded-xl h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  type PillConfig = { pill: string; dot: string; label: string };
  const fallback: PillConfig = { pill: "bg-surface-subtle text-muted", dot: "bg-muted", label: "Expired" };
  const map: Record<string, PillConfig> = {
    active:         { pill: "bg-success text-success-foreground",     dot: "bg-success-foreground",  label: "Active"  },
    overdue:        { pill: "bg-warning text-warning-foreground",     dot: "bg-warning-foreground",  label: "Overdue" },
    expired:        fallback,
    pending_invite: { pill: "bg-primary-subtle text-brand",           dot: "bg-brand",               label: "Pending" },
  };
  const c = map[status] ?? fallback;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label font-medium ${c.pill}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Membership list ──────────────────────────────────────────────────────────

async function MembershipList() {
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

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("id, status, joined_at, next_due_date, club_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: false });

  if (!memberships || memberships.length === 0) {
    redirect("/discover");
  }

  const clubIds = memberships.map((m) => m.club_id);
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .in("id", clubIds);

  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-h1 font-bold text-heading">
          {greeting}, {firstName}
        </h1>
        <p className="text-body text-muted mt-1">Here&apos;s your fitness journey</p>
      </div>

      {/* Club list */}
      <div className="space-y-3">
        <p className="text-label text-muted uppercase tracking-wider">Your clubs</p>

        {memberships.map((m) => {
          const club = clubMap.get(m.club_id);
          if (!club) return null;

          const daysUntilDue = m.next_due_date
            ? Math.ceil((new Date(m.next_due_date).getTime() - Date.now()) / 86400000)
            : null;
          const isUrgent = daysUntilDue !== null && daysUntilDue <= 5;
          const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

          return (
            <Link
              key={m.id}
              href={`/portal/${club.slug}`}
              className="group flex items-center gap-4 p-4 bg-surface-raised border border-border rounded-xl hover:border-brand/40 hover:bg-surface-subtle transition-all"
            >
              <div className="size-11 rounded-xl bg-primary-subtle flex items-center justify-center shrink-0">
                <Building2 className="size-5 text-brand" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-body font-semibold text-heading truncate">{club.name}</p>
                  <StatusPill status={m.status} />
                </div>
                {m.next_due_date && (
                  <p
                    className={`text-caption flex items-center gap-1 font-medium ${
                      isOverdue ? "text-error-foreground" : isUrgent ? "text-warning-foreground" : "text-muted"
                    }`}
                  >
                    <Clock className="size-3" />
                    {isOverdue
                      ? `${Math.abs(daysUntilDue!)} days overdue`
                      : daysUntilDue === 0
                      ? "Due today"
                      : `Due ${formatDate(m.next_due_date)}`}
                  </p>
                )}
              </div>

              <ChevronRight className="size-4 text-muted group-hover:text-brand transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="flex gap-2">
        {[
          { href: "/portal/invites", icon: Search,  label: "Invites" },
          { href: "/onboarding",     icon: Plus,    label: "New Club" },
          { href: "/explore",        icon: Compass, label: "Explore" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-raised border border-border text-caption font-medium text-muted hover:border-brand/40 hover:text-brand transition-all"
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PortalPage() {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <MembershipList />
    </Suspense>
  );
}
