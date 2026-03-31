// /portal — member home
//
// If user has memberships: list clubs they belong to.
// If no memberships: empty state with CTAs.

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus, Search, Compass } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@zenzo/utils";

// ─── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:  "bg-success-subtle text-success-foreground",
    overdue: "bg-warning-subtle text-warning-foreground",
    expired: "bg-surface-subtle text-muted",
    pending_invite: "bg-primary-subtle text-brand",
  };
  const labels: Record<string, string> = {
    active: "Active",
    overdue: "Overdue",
    expired: "Expired",
    pending_invite: "Pending",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-caption font-medium ${styles[status] ?? "bg-surface-subtle text-muted"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PortalSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="skeleton-shimmer rounded-xl h-24 w-full" />
      ))}
    </div>
  );
}

// ─── Memberships loader ──────────────────────────────────────────────────────

async function MembershipList() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("id, status, joined_at, next_due_date, club_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: false });

  if (!memberships || memberships.length === 0) {
    return <EmptyState />;
  }

  const clubIds = memberships.map((m) => m.club_id);
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .in("id", clubIds);

  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-3">
      <h2 className="text-h3 text-heading">Your clubs</h2>
      {memberships.map((m) => {
        const club = clubMap.get(m.club_id);
        if (!club) return null;
        return (
          <Link
            key={m.id}
            href={`/portal/${club.slug}`}
            className="block bg-surface-raised border border-border rounded-xl px-5 py-4 hover:border-brand/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body font-semibold text-heading truncate">{club.name}</p>
                {m.next_due_date && (
                  <p className="text-caption text-muted mt-0.5">
                    Due {formatDate(m.next_due_date)}
                  </p>
                )}
              </div>
              <StatusBadge status={m.status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-16 space-y-6">
      <div className="size-16 rounded-full bg-primary-subtle flex items-center justify-center mx-auto">
        <Building2 className="size-7 text-brand" />
      </div>

      <div className="space-y-2">
        <h2 className="text-h2 text-heading">You&apos;re not in any club yet</h2>
        <p className="text-body text-muted max-w-xs mx-auto">
          Join a club via invite link, check pending invites, or create your own club.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Link
          href="/portal/invites"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-body hover:bg-primary/90 transition-colors"
        >
          <Search className="size-4" />
          Check for Invites
        </Link>
        <Link
          href="/onboarding"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-raised border border-border font-medium text-body text-heading hover:bg-surface-subtle transition-colors"
        >
          <Plus className="size-4" />
          Create a Club
        </Link>
        <Link
          href="/explore"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-raised border border-border font-medium text-body text-heading hover:bg-surface-subtle transition-colors"
        >
          <Compass className="size-4" />
          Explore Clubs
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalPage() {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <MembershipList />
    </Suspense>
  );
}
