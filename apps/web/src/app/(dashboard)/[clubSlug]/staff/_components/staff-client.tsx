"use client";

// ─── StaffClient ──────────────────────────────────────────────────────────────
//
// Renders the staff list and the "Add Coach" form.
// Add Coach: phone lookup → if user found on Zenzo, adds to club_staff.
// Remove: DELETE /api/clubs/[clubSlug]/staff/[staffId]

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserMinus, Plus, Shield, Dumbbell } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  FormField,
  Input,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
  IconButton,
} from "@zenzo/ui";
import { StaffRole } from "@zenzo/database/enums";

export interface StaffMember {
  staffId: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: StaffRole;
}

interface StaffClientProps {
  clubSlug: string;
  currentUserId: string;
  staff: StaffMember[];
}

export function StaffClient({ clubSlug, currentUserId, staff }: StaffClientProps) {
  const router = useRouter();
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [removeTarget, setRemoveTarget]   = React.useState<StaffMember | null>(null);
  const [isRemoving, setIsRemoving]       = React.useState(false);
  const [removeError, setRemoveError]     = React.useState("");

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    setRemoveError("");
    try {
      const res = await fetch(
        `/api/clubs/${clubSlug}/staff/${removeTarget.staffId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) { setRemoveError(data.error ?? "Failed to remove."); return; }
      setRemoveTarget(null);
      router.refresh();
    } catch {
      setRemoveError("Network error.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-foreground">Staff</h1>
            <p className="text-[13px] text-muted mt-0.5">
              Manage your club's owners and coaches.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Coach
          </Button>
        </div>

        {/* ── Staff list ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {staff.map((m) => {
            const isOwner  = m.role === StaffRole.Owner;
            const isSelf   = m.userId === currentUserId;

            return (
              <div
                key={m.staffId}
                className="flex items-center justify-between px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.fullName} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-foreground">
                        {m.fullName}
                        {isSelf && (
                          <span className="ml-1 text-[12px] text-muted font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                      <Badge
                        variant={isOwner ? "info" : "neutral"}
                        label={isOwner ? "Owner" : "Coach"}
                        size="sm"
                        icon={isOwner ? <Shield className="size-2.5" /> : <Dumbbell className="size-2.5" />}
                      />
                    </div>
                    <p className="text-[12px] text-muted font-mono">{m.phone}</p>
                    {m.email && (
                      <p className="text-[12px] text-muted">{m.email}</p>
                    )}
                  </div>
                </div>

                {/* Only show remove for coaches you can remove (not owner, not self) */}
                {!isOwner && !isSelf && (
                  <IconButton
                    icon={<UserMinus className="size-4" />}
                    label="Remove coach"
                    className="text-muted hover:text-error-foreground"
                    onClick={() => setRemoveTarget(m)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add Coach Dialog ─────────────────────────────────────────────── */}
      {showAddDialog && (
        <AddCoachDialog
          clubSlug={clubSlug}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => { setShowAddDialog(false); router.refresh(); }}
        />
      )}

      {/* ── Remove Confirmation ──────────────────────────────────────────── */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) { setRemoveTarget(null); setRemoveError(""); } }}
      >
        <DialogContent title="Remove Coach">
          <p className="text-[14px] text-foreground">
            Remove <strong>{removeTarget?.fullName}</strong> as a coach from this club?
          </p>
          <p className="text-[13px] text-muted mt-1">
            They will lose access to the dashboard immediately.
          </p>
          {removeError && (
            <p className="text-[13px] text-error-foreground mt-2">{removeError}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="danger" disabled={isRemoving} onClick={handleRemove}>
              {isRemoving ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── AddCoachDialog ───────────────────────────────────────────────────────────

function AddCoachDialog({
  clubSlug,
  onClose,
  onSuccess,
}: {
  clubSlug: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [phone,     setPhone]     = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error,     setError]     = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = phone.trim().replace(/\D/g, "");
    if (p.length !== 10) { setError("Enter a valid 10-digit phone number."); return; }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add coach."); return; }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent title="Add Coach">
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <p className="text-[13px] text-muted">
            The person must already have a Zenzo account. Enter their registered
            phone number. Coaches can be shared across multiple clubs.
          </p>
          <FormField label="Phone Number" required>
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              autoFocus
            />
          </FormField>
          {error && (
            <p className="text-[13px] text-error-foreground">{error}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Adding…" : "Add Coach"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
