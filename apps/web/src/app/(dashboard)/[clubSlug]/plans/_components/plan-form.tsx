"use client";

// ─── PlanForm ────────────────────────────────────────────────────────────────
//
// Form for creating or editing a Fee Plan.
//
// Fields:
//   - Name (required)
//   - Amount (required, in Rupees, converted to paise for API)
//   - Billing Cycle (required select)

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormField,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  cn,
} from "@zenzo/ui";
import { BillingCycle } from "@zenzo/database/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanFormProps {
  clubSlug: string;
  initialData?: {
    id: string;
    name: string;
    amount_paise: number;
    billing_cycle: BillingCycle;
  };
}

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: BillingCycle.Monthly,    label: "Monthly" },
  { value: BillingCycle.Quarterly,  label: "Quarterly" },
  { value: BillingCycle.HalfYearly, label: "Half-Yearly" },
  { value: BillingCycle.Annual,     label: "Annual" },
  { value: BillingCycle.PerSession,  label: "Per Session" },
];

export function PlanForm({ clubSlug, initialData }: PlanFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [name,         setName]         = React.useState(initialData?.name ?? "");
  const [amountRupees, setAmountRupees] = React.useState(
    initialData ? (initialData.amount_paise / 100).toString() : ""
  );
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(
    initialData?.billing_cycle ?? BillingCycle.Monthly
  );

  const [errors,    setErrors]    = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // ── Validation ──────────────────────────────────────────────────────────
  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Plan name is required";
    
    const amt = parseFloat(amountRupees);
    if (!amountRupees) next.amount = "Amount is required";
    else if (isNaN(amt) || amt < 0) next.amount = "Invalid amount";
    
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const amount_paise = Math.round(parseFloat(amountRupees) * 100);
    const url = isEdit ? `/api/plans/${initialData.id}` : "/api/plans";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubSlug,
          name: name.trim(),
          amount_paise,
          billing_cycle: billingCycle,
        }),
      });

      const data = (await res.json()) as { planId?: string; error?: string; success?: boolean };

      if (res.ok && (data.planId || data.success)) {
        router.push(`/${clubSlug}/plans`);
        router.refresh();
        return;
      }

      setErrors({ form: data.error ?? `Failed to ${isEdit ? 'update' : 'create'} plan.` });
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── Plan Name ──────────────────────────────────────────────────── */}
      <FormField label="Plan Name" htmlFor="name" required error={errors.name}>
        <Input
          id="name"
          type="text"
          placeholder="e.g. Basic Monthly"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          autoComplete="off"
        />
      </FormField>

      {/* ── Amount (Rupees) ────────────────────────────────────────────── */}
      <FormField label="Amount (₹)" htmlFor="amount" required error={errors.amount}>
        <Input
          id="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={amountRupees}
          onChange={(e) => setAmountRupees(e.target.value)}
          error={!!errors.amount}
          prefix={<span className="text-muted-foreground mr-1 text-[13px]">₹</span>}
        />
      </FormField>

      {/* ── Billing Cycle ──────────────────────────────────────────────── */}
      <FormField label="Billing Cycle" htmlFor="billingCycle" required>
        <Select 
          value={billingCycle} 
          onValueChange={(val) => setBillingCycle(val as BillingCycle)}
        >
          <SelectTrigger id="billingCycle" />
          <SelectContent>
            {CYCLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* ── Form-level error ─────────────────────────────────────────────── */}
      {errors.form && (
        <p role="alert" className="text-[13px] text-error-foreground">
          {errors.form}
        </p>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${clubSlug}/plans`)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? (isEdit ? "Updating…" : "Creating…") : (isEdit ? "Update Plan" : "Create Plan")}
        </Button>
      </div>
    </form>
  );
}
