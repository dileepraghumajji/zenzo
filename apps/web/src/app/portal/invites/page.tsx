"use client";

// /portal/invites — pending club invites for the current user.
//
// Lists all pending club_invites where email = current user's email.
// Each invite shows: Club name, invited by, plan name, batch name, expiry.
// [Accept] → calls POST /api/auth/activate-invite?token=xxx → refreshes list.
// [Decline] → calls POST /api/portal/invites/[id]/decline → refreshes list.

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@zenzo/ui";
import { formatDate } from "@zenzo/utils";

type Invite = {
  id: string;
  token: string;
  club_name: string;
  invited_by_name: string | null;
  plan_name: string | null;
  batch_name: string | null;
  expires_at: string;
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function InvitesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="skeleton-shimmer rounded-xl h-28 w-full" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites]   = useState<Invite[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null); // invite id being processed
  const [error, setError]       = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/invites");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load invites");
      const json = (await res.json()) as { invites: Invite[] };
      setInvites(json.invites);
    } catch {
      setError("Could not load invites. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  async function handleAccept(invite: Invite) {
    setActing(invite.id);
    try {
      const res = await fetch(
        `/api/auth/activate-invite?token=${encodeURIComponent(invite.token)}`,
        { method: "POST" }
      );
      if (res.ok) {
        router.push("/portal");
      } else {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Failed to accept invite");
        void fetchInvites();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActing(null);
    }
  }

  async function handleDecline(inviteId: string) {
    setActing(inviteId);
    try {
      const res = await fetch(`/api/portal/invites/${inviteId}/decline`, { method: "POST" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Failed to decline invite");
      }
      void fetchInvites();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/portal"
          className="size-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle transition-colors text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-h2 text-heading">Pending Invites</h1>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <InvitesSkeleton />
      ) : invites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="bg-surface-raised border border-border rounded-xl px-5 py-4 space-y-3"
            >
              {/* Club + meta */}
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
                  <Building2 className="size-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-heading truncate">
                    {invite.club_name}
                  </p>
                  {invite.invited_by_name && (
                    <p className="text-caption text-muted">
                      Invited by {invite.invited_by_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Details row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
                {invite.plan_name && <span>Plan: {invite.plan_name}</span>}
                {invite.batch_name && <span>Batch: {invite.batch_name}</span>}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Expires {formatDate(invite.expires_at)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => void handleAccept(invite)}
                  loading={acting === invite.id}
                  disabled={acting !== null}
                >
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleDecline(invite.id)}
                  loading={acting === invite.id}
                  disabled={acting !== null}
                >
                  <XCircle className="size-4 mr-1.5" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="size-16 rounded-full bg-surface-subtle flex items-center justify-center mx-auto">
        <Building2 className="size-7 text-muted" />
      </div>
      <div className="space-y-2">
        <h2 className="text-h3 text-heading">No pending invites</h2>
        <p className="text-body text-muted max-w-xs mx-auto">
          You don&apos;t have any pending club invites right now.
        </p>
      </div>
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-brand font-medium text-body hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to portal
      </Link>
    </div>
  );
}
