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
import { Mail, CheckCircle, User } from "lucide-react";

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

  const [fullName, setFullName] = React.useState("");
  const [email,   setEmail]   = React.useState("");
  const [batchId, setBatchId] = React.useState("");
  const [planId,  setPlanId]  = React.useState("");
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );

  const [errors,   setErrors]   = React.useState<Record<string, string>>({});
  const [apiState, setApiState] = React.useState<
    "idle" | "loading" | "invite_sent" | "already_a_member"
  >("idle");

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const next: Record<string, string> = {};
    if (!fullName.trim())                                next.fullName = "Member name is required";
    if (!email.trim())                                   next.email   = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email   = "Enter a valid email address";
    if (!batchId)                                        next.batchId = "Select a batch";
    if (!planId)                                         next.planId  = "Select a fee plan";
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
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
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

      if (res.ok && data.status === "invite_sent") {
        setApiState("invite_sent");
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

      {/* ── Full Name ─────────────────────────────────────────────────────── */}
      <FormField
        label="Member Name"
        htmlFor="fullName"
        required
        error={errors.fullName}
      >
        <Input
          id="fullName"
          type="text"
          inputMode="text"
          placeholder="Rahul Sharma"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setApiState("idle");
          }}
          error={!!errors.fullName}
          prefix={<User />}
          autoComplete="off"
        />
      </FormField>

      {/* ── Email ─────────────────────────────────────────────────────────── */}
      <FormField
        label="Email Address"
        htmlFor="email"
        required
        error={errors.email}
        hint="They'll receive an invite email if they're not on Zenzo yet"
      >
        <Input
          id="email"
          type="email"
          inputMode="email"
          placeholder="member@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setApiState("idle");
          }}
          error={!!errors.email}
          prefix={<Mail />}
          autoComplete="email"
        />
      </FormField>

      {/* ── Invite sent banner ────────────────────────────────────────────── */}
      {apiState === "invite_sent" && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface-subtle text-[13px] text-muted">
          <CheckCircle className="size-4 shrink-0 mt-0.5 text-brand" />
          <p>
            Invite sent to{" "}
            <span className="text-foreground font-medium">{email}</span>.
            Membership will activate once they sign up on Zenzo.
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
