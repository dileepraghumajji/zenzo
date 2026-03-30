"use client";

// ─── PlansClient ─────────────────────────────────────────────────────────────
//
// Responsibilities:
//   - Card grid (2 cols desktop, 1 col mobile)
//   - Per-card: name, amount, billing cycle, active member count
//   - Card ⋮ menu: Edit, Delete
//   - Empty state

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Users,
  MoreVertical,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from "@zenzo/ui";
import { BillingCycle } from "@zenzo/database/enums";
import { formatCurrency } from "@zenzo/utils";
import { Skeleton } from "@/components/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanRow {
  id: string;
  name: string;
  amountPaise: number;
  billingCycle: BillingCycle;
  memberCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CYCLE_LABEL: Record<BillingCycle, string> = {
  [BillingCycle.Monthly]:      "Monthly",
  [BillingCycle.Quarterly]:    "Quarterly",
  [BillingCycle.HalfYearly]:   "Half-Yearly",
  [BillingCycle.Annual]:       "Annual",
  [BillingCycle.PerSession]:   "Per Session",
};

// ─── PlansClient ─────────────────────────────────────────────────────────────

interface PlansClientProps {
  plans: PlanRow[];
  clubSlug: string;
}

export function PlansClient({ plans, clubSlug }: PlansClientProps) {
  const router = useRouter();

  // ── Empty state ──────────────────────────────────────────────────────────
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-muted" />
        </div>
        <p className="text-[16px] font-semibold text-heading mb-1">No fee plans yet</p>
        <p className="text-[14px] text-muted mb-6 max-w-xs">
          Create your first fee plan to start enrolling members.
        </p>
        <Link href={`/${clubSlug}/plans/new`}>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Create Plan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          clubSlug={clubSlug}
          onEdit={() => router.push(`/${clubSlug}/plans/${plan.id}?edit=1`)}
          onDelete={() => {
             if (plan.memberCount > 0) {
               alert(`Cannot delete plan with active members (${plan.memberCount}). Reassign members first.`);
               return;
             }
             if (confirm("Are you sure you want to delete this plan?")) {
               fetch(`/api/plans/${plan.id}`, { 
                 method: 'DELETE',
                 body: JSON.stringify({ clubSlug }),
                 headers: { 'Content-Type': 'application/json' }
               }).then(res => {
                 if (res.ok) router.refresh();
                 else alert("Failed to delete plan");
               });
             }
          }}
        />
      ))}
    </div>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: PlanRow;
  clubSlug: string;
  onEdit: () => void;
  onDelete: () => void;
}

function PlanCard({ plan, clubSlug, onEdit, onDelete }: PlanCardProps) {
  const editHref = `/${clubSlug}/plans/${plan.id}?edit=1`;

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-background",
        "hover:bg-surface-subtle transition-colors duration-100 group"
      )}
    >
      {/* ── Card content ─────────────────────────────────────────────────── */}
      <Link href={editHref} className="block p-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[16px] font-semibold text-foreground leading-tight">
            {plan.name}
          </p>
          <div className="w-8 shrink-0" />
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-1.5 text-[15px] font-medium text-foreground mb-1">
          <span className="font-mono">{formatCurrency(plan.amountPaise)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted mb-4">
          <RefreshCw className="size-3.5 shrink-0" />
          <span>{CYCLE_LABEL[plan.billingCycle]} billing</span>
        </div>

        {/* Members count */}
        <div className="flex items-center gap-1.5 text-[13px] text-muted">
          <Users className="size-3.5 shrink-0" />
          <span>
            {plan.memberCount} active {plan.memberCount === 1 ? "member" : "members"}
          </span>
        </div>
      </Link>

      {/* ── ⋮ menu (absolute, top-right) ────────────────────────────────── */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              icon={<MoreVertical className="size-4" />}
              label="Plan actions"
              className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem icon={<Pencil />} onSelect={onEdit}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<Trash2 />}
              onSelect={onDelete}
              className="text-error-foreground focus:text-error-foreground"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── PlanListSkeleton ────────────────────────────────────────────────────────

export function PlanListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3.5 w-32" />
          <div className="pt-1">
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
