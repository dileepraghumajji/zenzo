"use client";

// ─── InviteForm ─────────────────────────────────────────────────────────────────
//
// Full Add Member form. Submitted to POST /api/members/invite.
//
// Flow:
//   1. Enter phone → API looks up Zenzo account
//   2. If found → membership created (active), redirect to member profile
//   3. If not_on_zenzo → show guidance banner (WhatsApp invite deferred to S2.7)
//   4. If already_a_member → show inline error

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
} from "@zenzo/ui";
import { formatCurrency } from "@zenzo/utils";
import { Phone, UserX } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Batch {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  amount_paise: number;
}

interface InviteFormProps {
  clubSlug: string;
  batches: Batch[];
  plans: Plan[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InviteForm({ clubSlug, batches, plans }: InviteFormProps) {
  const router = useRouter();

  const [phone,   setPhone]   = React.useState("");
  const [batchId, setBatchId] = React.useState("");
  const [planId,  setPlanId]  = React.useState("");
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );

  const [errors,   setErrors]   = React.useState<Record<string, string>>({});
  const [apiState, setApiState] = React.useState<
    "idle" | "loading" | "not_on_zenzo" | "already_a_member"
  >("idle");

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const next: Record<string, string> = {};
    const digits = phone.replace(/\D/g, "");
    if (!digits)         next.phone   = "Phone number is required";
    else if (digits.length !== 10) next.phone = "Must be a 10-digit mobile number";
    if (!batchId)        next.batchId = "Select a batch";
    if (!planId)         next.planId  = "Select a fee plan";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setApiState("loading");
    setErrors({});

    try {
      const res = await fetch("/api/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubSlug,
          phone: phone.replace(/\D/g, ""),
          batchId,
          planId,
          startDate,
        }),
      });

      const data = (await res.json()) as {
        status?: string;
        error?: string;
        userId?: string;
      };

      if (res.ok && data.status === "added") {
        router.push(`/${clubSlug}/members/${data.userId}`);
        return;
      }

      if (res.ok && data.status === "not_on_zenzo") {
        setApiState("not_on_zenzo");
        return;
      }

      if (res.status === 409 && data.error === "already_a_member") {
        setApiState("already_a_member");
        return;
      }

      // Generic error
      setErrors({ form: data.error ?? "Something went wrong. Please try again." });
      setApiState("idle");
    } catch {
      setErrors({ form: "Network error. Please try again." });
      setApiState("idle");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* ── Phone ─────────────────────────────────────────────────────────── */}
      <FormField
        label="Phone Number"
        htmlFor="phone"
        required
        error={errors.phone}
        hint="10-digit Indian mobile number"
      >
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setApiState("idle");
          }}
          error={!!errors.phone}
          prefix={<Phone />}
          maxLength={10}
          autoComplete="tel"
        />
      </FormField>

      {/* ── Not on Zenzo banner ───────────────────────────────────────────── */}
      {apiState === "not_on_zenzo" && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface-subtle text-[13px] text-muted">
          <UserX className="size-4 shrink-0 mt-0.5 text-muted" />
          <p>
            No Zenzo account found for this number.{" "}
            <span className="text-foreground font-medium">
              They&apos;ll receive a WhatsApp invite to sign up.
            </span>{" "}
            Membership will activate once they join.
          </p>
        </div>
      )}

      {/* ── Already a member banner ───────────────────────────────────────── */}
      {apiState === "already_a_member" && (
        <div className="px-4 py-3 rounded-xl border border-error-accent bg-error-subtle text-[13px] text-error-foreground">
          This person is already a member of this club.
        </div>
      )}

      {/* ── Batch ─────────────────────────────────────────────────────────── */}
      <FormField label="Batch" htmlFor="batchId" required error={errors.batchId}>
        <Select value={batchId} onValueChange={setBatchId}>
          <SelectTrigger
            id="batchId"
            placeholder="Select batch…"
            error={!!errors.batchId}
          />
          <SelectContent>
            {batches.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-muted">
                No batches yet — create one first.
              </div>
            ) : (
              batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </FormField>

      {/* ── Fee Plan ──────────────────────────────────────────────────────── */}
      <FormField label="Fee Plan" htmlFor="planId" required error={errors.planId}>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger
            id="planId"
            placeholder="Select plan…"
            error={!!errors.planId}
          />
          <SelectContent>
            {plans.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-muted">
                No plans yet — create one first.
              </div>
            ) : (
              plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}{" "}
                  <span className="text-muted font-mono">
                    ({formatCurrency(p.amount_paise)})
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </FormField>

      {/* ── Start Date ────────────────────────────────────────────────────── */}
      <FormField label="Start Date" htmlFor="startDate">
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </FormField>

      {/* ── Form-level error ──────────────────────────────────────────────── */}
      {errors.form && (
        <p role="alert" className="text-[13px] text-error-foreground">
          {errors.form}
        </p>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${clubSlug}/members`)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={apiState === "loading"}
        >
          {apiState === "loading" ? "Adding…" : "Add Member"}
        </Button>
      </div>

    </form>
  );
}
