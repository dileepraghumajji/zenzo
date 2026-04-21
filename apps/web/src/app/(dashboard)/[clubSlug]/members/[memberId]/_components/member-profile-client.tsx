"use client";

// ─── MemberProfileClient ────────────────────────────────────────────────────────
//
// Client shell for the member profile.
// Tabs: Overview | Attendance | Payments | Progression
// For now, Overview is fully built. Other tabs show a "coming soon" placeholder.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MoreVertical,
  MessageCircle,
  Pencil,
  UserMinus,
  CreditCard,
  CalendarDays,
  Award,
  Link2,
  Copy,
  ExternalLink,
  Check as CheckIcon,
  Loader2,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
  FormField,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  cn,
} from "@zenzo/ui";
import { formatCurrency, formatDate } from "@zenzo/utils";
import { MembershipStatus, AttendanceStatus } from "@zenzo/database/enums";
import { RecordPaymentModal } from "./record-payment-modal";
import { AwardAchievementDialog } from "./award-achievement-dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  batchName: string | null;
}

interface Payment {
  id: string;
  amountPaise: number;
  method: string;
  date: string;
}

interface MemberDetail {
  userId: string;
  membershipId: string;
  planId: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  status: MembershipStatus;
  joinedAt: string;
  nextDueDate: string | null;
  planName: string | null;
  planAmountPaise: number | null;
  batchNames: string[];
  attendancePct: number | null;
  recentAttendance: AttendanceRecord[];
  allPayments: Payment[];
}

interface AvailablePlan {
  id: string;
  name: string;
  amount_paise: number;
  billing_cycle: string;
}

interface AvailableBatch {
  id: string;
  name: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  badgeIcon: string | null;
  awardedAt: string;
  awardedByName: string | null;
}

interface MemberProfileClientProps {
  clubSlug: string;
  member: MemberDetail;
  availablePlans: AvailablePlan[];
  availableBatches: AvailableBatch[];
  currentBatchIds: string[];
  initialAchievements: Achievement[];
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  MembershipStatus,
  { label: string; variant: "success" | "error" | "neutral" | "info" }
> = {
  [MembershipStatus.Active]: { label: "Active", variant: "success" },
  [MembershipStatus.Overdue]: { label: "Overdue", variant: "error" },
  [MembershipStatus.Expired]: { label: "Expired", variant: "neutral" },
  [MembershipStatus.PendingInvite]: { label: "Pending Invite", variant: "info" },
  [MembershipStatus.Deleted]: { label: "Deleted", variant: "neutral" },
};

// ─── MemberProfileClient ───────────────────────────────────────────────────────

export function MemberProfileClient({ clubSlug, member, availablePlans, availableBatches, currentBatchIds, initialAchievements }: MemberProfileClientProps) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[member.status] || { label: "Deleted", variant: "neutral" };
  const [isDeactivating, setIsDeactivating] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = React.useState(false);
  const [isUpdatingBatch, setIsUpdatingBatch] = React.useState(false);

  // Modal states
  const [showDeactivateDealog, setShowDeactivateDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showPlanDialog, setShowPlanDialog] = React.useState(false);
  const [showBatchDialog, setShowBatchDialog] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showAwardDialog, setShowAwardDialog] = React.useState(false);
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = React.useState(false);
  const [paymentLinkLoading, setPaymentLinkLoading] = React.useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = React.useState<string | null>(null);
  const [paymentLinkError, setPaymentLinkError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [achievements, setAchievements] = React.useState<Achievement[]>(initialAchievements);

  const [selectedPlanId, setSelectedPlanId] = React.useState(member.planId ?? "");
  const [selectedBatchId, setSelectedBatchId] = React.useState(currentBatchIds[0] ?? "");

  const performAction = async (actionType: "deactivate" | "delete" | "update_plan" | "update_batch") => {
    try {
      if (actionType === "deactivate")   setIsDeactivating(true);
      if (actionType === "delete")       setIsDeleting(true);
      if (actionType === "update_plan")  setIsUpdatingPlan(true);
      if (actionType === "update_batch") setIsUpdatingBatch(true);

      const method = actionType === "delete" ? "DELETE" : "PATCH";
      let body: Record<string, string> | undefined;

      if (actionType === "deactivate")   body = { action: "deactivate" };
      if (actionType === "update_plan")  body = { action: "update_plan",  planId:  selectedPlanId };
      if (actionType === "update_batch") body = { action: "update_batch", batchId: selectedBatchId };

      const res = await fetch(`/api/clubs/${clubSlug}/members/${member.membershipId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) throw new Error("Action failed");

      setShowDeactivateDialog(false);
      setShowDeleteDialog(false);
      setShowPlanDialog(false);
      setShowBatchDialog(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsDeactivating(false);
      setIsDeleting(false);
      setIsUpdatingPlan(false);
      setIsUpdatingBatch(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    setPaymentLinkLoading(true);
    setPaymentLinkError(null);
    setPaymentLinkUrl(null);
    try {
      const res = await fetch(
        `/api/clubs/${clubSlug}/members/${member.membershipId}/payment-link`,
        { method: "POST" }
      );
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to generate link");
      setPaymentLinkUrl(data.url ?? null);
    } catch (err) {
      setPaymentLinkError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPaymentLinkLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentLinkUrl) return;
    await navigator.clipboard.writeText(paymentLinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDayOfMonth = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
  };

  const recentPayments = member.allPayments.slice(0, 5);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto space-y-6">

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        href={`/${clubSlug}/members`}
        className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Members
      </Link>

      {/* ── Profile header card ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">

          {/* Avatar + info */}
          <div className="flex items-center gap-4">
            <Avatar name={member.fullName} size="lg" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] font-bold text-foreground leading-tight">
                  {member.fullName}
                </h1>
                <Badge
                  variant={statusCfg.variant}
                  label={statusCfg.label}
                  dot
                  size="sm"
                />
              </div>
              <p className="text-[13px] text-muted font-mono">{member.phone}</p>
              {member.email && (
                <p className="text-[13px] text-muted">{member.email}</p>
              )}
              <p className="text-[13px] text-muted">
                {member.batchNames.length > 0
                  ? member.batchNames.join(", ")
                  : "No batch"}
                {member.planAmountPaise != null && (
                  <>
                    {" · "}
                    <span className="font-mono">
                      {formatCurrency(member.planAmountPaise)}
                      {member.planName ? ` (${member.planName})` : ""}
                    </span>
                  </>
                )}
              </p>
              <p className="text-[12px] text-muted">
                Member since {formatDate(member.joinedAt)}
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil className="size-3.5" />}
              onClick={() => router.push(`/${clubSlug}/members/${member.userId}?edit=1`)}
            >
              <span className="hidden sm:inline">Edit</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  icon={<MoreVertical className="size-4" />}
                  label="More actions"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  icon={<MessageCircle />}
                  onSelect={() => window.open(`https://wa.me/91${member.phone}`, "_blank")}
                >
                  Send WhatsApp
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  icon={<Award className="size-4" />}
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowAwardDialog(true);
                  }}
                >
                  Award Badge
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  icon={<Link2 className="size-4" />}
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowPaymentLinkDialog(true);
                    handleGeneratePaymentLink();
                  }}
                >
                  Send Payment Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  icon={<CreditCard className="size-4" />}
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowPlanDialog(true);
                  }}
                >
                  Change Fee Plan
                </DropdownMenuItem>
                <DropdownMenuItem
                  icon={<CalendarDays className="size-4" />}
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowBatchDialog(true);
                  }}
                >
                  Change Batch
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  icon={<UserMinus />}
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowDeactivateDialog(true);
                  }}
                >
                  Deactivate Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-error-foreground hover:bg-error-subtle focus:bg-error-subtle"
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                >
                  Delete Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="achievements">
            Achievements
            {achievements.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-primary-foreground leading-none">
                {achievements.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-6 space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              label="Attendance"
              value={member.attendancePct !== null ? `${member.attendancePct}%` : "—"}
              sub="this month"
            />
            <StatCard
              label="Next Due"
              value={member.nextDueDate ? formatDate(member.nextDueDate) : "—"}
              sub={
                member.planAmountPaise != null
                  ? formatCurrency(member.planAmountPaise)
                  : undefined
              }
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-primary text-[12px] px-2"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Record Payment
                </Button>
              }
            />
            <StatCard
              label="Plan"
              value={member.planName ?? "—"}
              sub={
                member.planAmountPaise != null
                  ? formatCurrency(member.planAmountPaise)
                  : undefined
              }
              className="col-span-2 lg:col-span-1"
            />
          </div>

          {/* Recent payments */}
          {recentPayments.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface-subtle flex justify-between items-center">
                <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-muted">
                  Recent Payments
                </p>
                <button
                  onClick={() => document.querySelector<HTMLButtonElement>('[value="payments"]')?.click()}
                  className="text-[12px] text-primary hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="divide-y divide-border">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">
                        {formatCurrency(p.amountPaise)}
                      </p>
                      <p className="text-[12px] text-muted capitalize">{p.method}</p>
                    </div>
                    <p className="text-[12px] text-muted">{formatDate(p.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentPayments.length === 0 && (
            <p className="text-[13px] text-muted text-center py-8">
              No payment history yet.
            </p>
          )}

        </TabsContent>

        {/* ── Attendance ────────────────────────────────────────────────────── */}
        <TabsContent value="attendance" className="mt-6">
          {member.recentAttendance.length > 0 ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-subtle border-b border-border">
                    <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">Date</th>
                    <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">Batch</th>
                    <th className="text-right px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {member.recentAttendance.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-subtle transition-colors duration-100">
                      <td className="px-4 py-3 text-[13px] text-foreground font-medium">
                        {getDayOfMonth(a.date)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted">
                        {a.batchName ?? "Drop-in"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant={a.status === AttendanceStatus.Present ? "success" : "neutral"}
                          label={a.status}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[13px] text-muted text-center py-8">
              No attendance records in the last 30 days.
            </p>
          )}
        </TabsContent>

        {/* ── Payments ───────────────────────────────────────────────────────── */}
        <TabsContent value="payments" className="mt-6">
          {member.allPayments.length > 0 ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-subtle border-b border-border">
                    <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">Date</th>
                    <th className="text-left px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">Method</th>
                    <th className="text-right px-4 py-3 text-[12px] font-medium text-muted uppercase tracking-[0.04em]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {member.allPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-subtle transition-colors duration-100">
                      <td className="px-4 py-3 text-[13px] text-foreground font-medium">
                        {formatDate(p.date)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted capitalize">
                        {p.method}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-mono text-foreground font-medium">
                        {formatCurrency(p.amountPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[13px] text-muted text-center py-8">
              No payment history yet.
            </p>
          )}
        </TabsContent>

        {/* ── Progression (placeholder) ────────────────────────────────────── */}
        <TabsContent value="progression" className="mt-6">
          <ComingSoon label="Belt / level progression" sprint="P1.1" />
        </TabsContent>

        {/* ── Achievements ─────────────────────────────────────────────────── */}
        <TabsContent value="achievements" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="secondary"
              size="sm"
              icon={<Award className="size-3.5" />}
              onClick={() => setShowAwardDialog(true)}
            >
              Award Badge
            </Button>
          </div>

          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <span className="text-[28px] leading-none shrink-0">{a.badgeIcon ?? "🎯"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-foreground leading-tight">{a.title}</p>
                    {a.description && (
                      <p className="text-[12px] text-muted mt-0.5">{a.description}</p>
                    )}
                    <p className="text-[11px] text-muted mt-1">
                      {new Date(a.awardedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {a.awardedByName && ` · by ${a.awardedByName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[15px] font-semibold text-heading mb-1">No badges yet</p>
              <p className="text-[13px] text-muted mb-4">Award the first badge to {member.fullName}</p>
              <Button
                variant="primary"
                size="sm"
                icon={<Award className="size-3.5" />}
                onClick={() => setShowAwardDialog(true)}
              >
                Award First Badge
              </Button>
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <Dialog open={showDeactivateDealog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent title="Deactivate Member">
          <p className="text-[14px] text-foreground">
            Are you sure you want to deactivate <strong>{member.fullName}</strong>?
          </p>
          <p className="text-[13px] text-muted mt-2">
            They will lose access to the member portal and will be marked as Expired.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              disabled={isDeactivating}
              onClick={() => performAction("deactivate")}
            >
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent title="Delete Profile">
          <p className="text-[14px] text-foreground">
            Are you sure you want to completely delete <strong>{member.fullName}</strong>&apos;s membership profile?
          </p>
          <p className="text-[13px] text-muted mt-2">
            This will soft-delete their membership record. Payment and attendance history will be preserved.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              disabled={isDeleting}
              onClick={() => performAction("delete")}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Plan Dialog ───────────────────────────────────────────── */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent title="Change Fee Plan">
          <div className="space-y-4 py-2">
            <p className="text-[14px] text-muted">
              Select a new fee plan for <strong>{member.fullName}</strong>.
            </p>
            <FormField label="Fee Plan">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger id="planId" placeholder="Select plan…" />
                <SelectContent>
                  {availablePlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.amount_paise)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              disabled={isUpdatingPlan || !selectedPlanId}
              onClick={() => performAction("update_plan")}
            >
              {isUpdatingPlan ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Batch Dialog ──────────────────────────────────────────── */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent title="Change Batch">
          <div className="space-y-4 py-2">
            <p className="text-[14px] text-muted">
              Select a new batch for <strong>{member.fullName}</strong>. This replaces all current batch assignments.
            </p>
            <FormField label="Batch">
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger id="batchId" placeholder="Select batch…" />
                <SelectContent>
                  {availableBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              disabled={isUpdatingBatch || !selectedBatchId}
              onClick={() => performAction("update_batch")}
            >
              {isUpdatingBatch ? "Updating..." : "Update Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Record Payment Modal ─────────────────────────────────────────── */}
      {showPaymentModal && (
        <RecordPaymentModal
          clubSlug={clubSlug}
          member={member}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            router.refresh();
          }}
        />
      )}

      {/* ── Award Achievement Dialog ─────────────────────────────────────── */}
      <AwardAchievementDialog
        open={showAwardDialog}
        onOpenChange={setShowAwardDialog}
        clubSlug={clubSlug}
        membershipId={member.membershipId}
        memberName={member.fullName}
        onSuccess={async () => {
          // Refresh achievements list without full page reload
          const res = await fetch(
            `/api/clubs/${clubSlug}/members/${member.membershipId}/achievements`
          );
          if (res.ok) {
            const data = await res.json() as Achievement[];
            setAchievements(data);
          }
        }}
      />

      {/* ── Payment Link Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={showPaymentLinkDialog}
        onOpenChange={(open) => {
          setShowPaymentLinkDialog(open);
          if (!open) {
            setPaymentLinkUrl(null);
            setPaymentLinkError(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent title="Send Payment Link">
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Generate a Razorpay payment link for{" "}
              <span className="font-semibold text-foreground">{member.fullName}</span>.
              Share it via WhatsApp or copy and send directly.
            </p>

            {paymentLinkLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm">Generating link…</span>
              </div>
            )}

            {paymentLinkError && (
              <div className="rounded-lg bg-error-subtle border border-error-accent px-4 py-3 text-sm text-error-foreground">
                {paymentLinkError}
              </div>
            )}

            {paymentLinkUrl && (
              <div className="space-y-3">
                <div className="rounded-lg bg-surface-subtle border border-border px-3 py-2 text-xs font-mono text-muted break-all select-all">
                  {paymentLinkUrl}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors"
                  >
                    {copied ? (
                      <><CheckIcon className="size-4 text-success-foreground" /> Copied</>
                    ) : (
                      <><Copy className="size-4" /> Copy link</>
                    )}
                  </button>
                  <a
                    href={paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors"
                  >
                    <ExternalLink className="size-4" /> Open
                  </a>
                </div>
                {member.phone && (
                  <a
                    href={`https://wa.me/91${member.phone}?text=${encodeURIComponent(`Hi ${member.fullName.split(" ")[0]}! Here's your payment link for ${member.planName ?? "your membership"}: ${paymentLinkUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
                  >
                    Send via WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">
                Close
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  className,
  action,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("relative rounded-xl border border-border bg-background p-4", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted mb-1">
        {label}
      </p>
      <p className="text-[20px] font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-[12px] text-muted mt-0.5 font-mono">{sub}</p>}
      {action && <div className="mt-3 pt-2 border-t border-border/50">{action}</div>}
    </div>
  );
}

// ─── ComingSoon ───────────────────────────────────────────────────────────────

function ComingSoon({ label, sprint }: { label: string; sprint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-[15px] font-semibold text-heading mb-1">{label}</p>
      <p className="text-[13px] text-muted">Coming in {sprint}</p>
    </div>
  );
}
