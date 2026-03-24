"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, MailCheck } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function validateEmail(v: string): string | null {
  if (!v.trim()) return "Please enter your email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
  return null;
}

/** Masks the local part: "rahul@gmail.com" → "r***@gmail.com" */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;
  return `${local[0]}***@${domain}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [cooldown, setCooldown]   = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendResetEmail() {
    setFormError(null);
    setLoading(true);

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setFormError("Something went wrong. Please try again.");
        return;
      }

      // Always transition to success — never reveal whether the email exists
      setSent(true);
      setCooldown(60);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) { setEmailError(error); return; }
    setEmailError(null);
    await sendResetEmail();
  }

  async function handleResend() {
    if (cooldown > 0) return;
    await sendResetEmail();
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">

          {/* Wordmark */}
          <div className="text-center mb-8">
            <span className="text-[26px] font-bold tracking-tight text-brand">zenzo</span>
          </div>

          <div className="bg-background rounded-xl border border-border shadow-md px-8 py-10 text-center space-y-5">

            {/* Icon */}
            <div
              className="size-14 rounded-full bg-primary-subtle flex items-center justify-center mx-auto"
              aria-hidden="true"
            >
              <MailCheck className="size-7 text-brand" />
            </div>

            {/* Copy */}
            <div className="space-y-2">
              <h1 className="text-h2 text-heading font-bold">Check your email</h1>
              <p className="text-body text-muted leading-6">
                We sent a password reset link to{" "}
                <span className="text-foreground font-medium">{maskEmail(email)}</span>.
                <br />
                It expires in 1 hour.
              </p>
            </div>

            {/* Resend */}
            <div className="pt-1">
              {cooldown > 0 ? (
                <p className="text-body-sm text-muted">
                  Resend available in{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {cooldown}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-body-sm text-brand hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Didn't get it? Resend"}
                </button>
              )}
            </div>

            {/* Back to login */}
            <div className="pt-1 border-t border-border">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-body-sm text-muted hover:text-foreground transition-colors duration-standard"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to login
              </Link>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">zenzo</span>
        </div>

        <div className="bg-background rounded-xl border border-border shadow-md px-8 py-8">

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-h1 text-heading font-bold">Reset your password</h1>
            <p className="mt-1.5 text-body text-muted">
              Enter your email and we&apos;ll send you a link to get back in.
            </p>
          </div>

          {/* Network error */}
          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
            >
              <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <FormField label="Email" htmlFor="email" error={emailError ?? undefined}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailError(validateEmail(email))}
                disabled={loading}
                placeholder="you@example.com"
                error={!!emailError}
              />
            </FormField>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Send reset link
            </Button>

          </form>

          {/* Back to login */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-body-sm text-muted hover:text-foreground transition-colors duration-standard"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
