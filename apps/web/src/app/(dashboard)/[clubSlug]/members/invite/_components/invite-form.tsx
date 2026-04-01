"use client";

// ─── InviteForm ─────────────────────────────────────────────────────────────────
//
// Phone-first Add Member form. Submitted to POST /api/members/invite.
//
// Flow:
//   1. Enter phone (required) + name (required) + optional email → submit
//   2. API looks up Zenzo account by phone (then email as fallback)
//   3. If found → membership created (active), redirect to member profile
//   4. If not_on_zenzo → show WhatsApp invite CTA + optional email sent notice
//   5. If already_a_member → show inline error

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
import { Mail, Phone, User, MessageCircle, CheckCircle } from "lucide-react";

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

  const [phone,     setPhone]     = React.useState("");
  const [fullName,  setFullName]  = React.useState("");
  const [email,     setEmail]     = React.useState("");
  const [batchId,   setBatchId]   = React.useState("");
  const [planId,    setPlanId]    = React.useState("");
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );

  const [errors,        setErrors]        = React.useState<Record<string, string>>({});
  const [apiState,      setApiState]      = React.useState<
    "idle" | "loading" | "not_on_zenzo" | "already_a_member"
  >("idle");
  const [whatsappLink,  setWhatsappLink]  = React.useState("");
  const [emailSent,     setEmailSent]     = React.useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const next: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.trim()))              next.phone    = "Enter a 10-digit mobile number";
    if (!fullName.trim())                             next.fullName = "Member name is required";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                                      next.email    = "Enter a valid email address";
    if (!batchId)                                     next.batchId  = "Select a batch";
    if (!planId)                                      next.planId   = "Select a fee plan";
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
          phone:    phone.trim(),
          fullName: fullName.trim(),
          email:    email.trim().toLowerCase() || undefined,
          batchId,
          planId,
          startDate,
        }),
      });

      const data = (await res.json()) as {
        status?: string;
        error?: string;
        userId?: string;
        whatsappLink?: string;
        emailSent?: boolean;
      };

      if (res.ok && data.status === "added") {
        router.push(`/${clubSlug}/members/${data.userId}`);
        return;
      }

      if (res.ok && data.status === "not_on_zenzo") {
        setWhatsappLink(data.whatsappLink ?? "");
        setEmailSent(data.emailSent ?? false);
        setApiState("not_on_zenzo");
        return;
      }

      if (res.status === 409 && data.error === "already_a_member") {
        setApiState("already_a_member");
        return;
      }

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
        label="Mobile Number"
        htmlFor="phone"
        required
        error={errors.phone}
        hint="Primary identifier — used to look up their Zenzo account"
      >
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setApiState("idle");
          }}
          error={!!errors.phone}
          prefix={<Phone />}
          autoComplete="tel"
        />
      </FormField>

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

      {/* ── Email (optional) ──────────────────────────────────────────────── */}
      <FormField
        label="Email Address"
        htmlFor="email"
        error={errors.email}
        hint="Optional — they'll also receive an email invite if not on Zenzo"
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

      {/* ── Not on Zenzo — WhatsApp CTA ───────────────────────────────────── */}
      {apiState === "not_on_zenzo" && (
        <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-3">
          <p className="text-[13px] text-foreground font-medium">
            {fullName} isn&apos;t on Zenzo yet.
          </p>
          <p className="text-[13px] text-muted">
            Share this invite link via WhatsApp. They&apos;ll be added to {clubSlug} once they sign up.
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-[13px] font-semibold hover:bg-[#1ebe5d] transition-colors"
          >
            <MessageCircle className="size-4" />
            Send invite via WhatsApp
          </a>
          {emailSent && email && (
            <div className="flex items-center gap-2 text-[12px] text-muted pt-1">
              <CheckCircle className="size-3.5 text-brand shrink-0" />
              Email invite also sent to {email}
            </div>
          )}
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
        {apiState === "not_on_zenzo" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setApiState("idle");
              setPhone("");
              setFullName("");
              setEmail("");
            }}
          >
            Invite Another
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={apiState === "loading"}
          >
            {apiState === "loading" ? "Adding…" : "Add Member"}
          </Button>
        )}
      </div>

    </form>
  );
}
