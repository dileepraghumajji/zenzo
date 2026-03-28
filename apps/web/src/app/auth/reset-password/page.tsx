"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function validatePassword(v: string): string | null {
  if (v.length < 8) return "At least 8 characters";
  return null;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type PageState = "loading" | "form" | "invalid" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirm?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // Supabase processes the recovery hash from the URL on mount.
  // If getUser() returns a user, the recovery session is valid.
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      setPageState(user ? "form" : "invalid");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const pwError = validatePassword(password);
    const confirmError = password !== confirm ? "Passwords don't match" : null;

    if (pwError || confirmError) {
      setErrors({
        password: pwError ?? undefined,
        confirm: confirmError ?? undefined,
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrors({ form: "Couldn't update password. Request a new reset link." });
        return;
      }

      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();
      setPageState("success");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── Shared chrome ─────────────────────────────────────────────────────────────

  function PageShell({ children }: { children: React.ReactNode }) {
    return (
      <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
          style={{ background: "var(--auth-glow)" }}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-[420px]">
          <div className="text-center mb-8">
            <span className="text-[26px] font-bold tracking-tight text-brand">
              zenzo
            </span>
          </div>
          {children}
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center">
        <div
          className="size-8 rounded-full border-2 border-border border-t-brand animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  // ── Invalid / expired link ────────────────────────────────────────────────────

  if (pageState === "invalid") {
    return (
      <PageShell>
        <div className="bg-surface-raised rounded-xl border border-border px-8 py-10 text-center space-y-5">
          <div>
            <h1 className="text-display text-heading">Link expired</h1>
            <p className="mt-2 text-body text-muted">
              This reset link is no longer valid. Request a new one.
            </p>
          </div>
          <Link href="/forgot-password">
            <Button fullWidth size="lg">
              Request new link
            </Button>
          </Link>
          <Link
            href="/login"
            className="block text-body-sm text-muted hover:text-foreground transition-colors duration-standard"
          >
            Back to login
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────

  if (pageState === "success") {
    return (
      <PageShell>
        <div className="bg-surface-raised rounded-xl border border-border px-8 py-10 text-center space-y-5">
          <div
            className="size-14 rounded-full bg-success flex items-center justify-center mx-auto"
            aria-hidden="true"
          >
            <CheckCircle2 className="size-7 text-success-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-h2 text-heading">Password updated</h1>
            <p className="text-body text-muted">
              Sign in with your new password.
            </p>
          </div>
          <Button fullWidth size="lg" onClick={() => router.push("/login")}>
            Sign in
          </Button>
        </div>
      </PageShell>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────

  return (
    <PageShell>
      <div className="bg-surface-raised rounded-xl border border-border px-8 py-10">

        <div className="mb-6">
          <h1 className="text-display text-heading">New password</h1>
          <p className="mt-1.5 text-body text-muted">
            Choose something you haven&apos;t used before.
          </p>
        </div>

        {errors.form && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
          >
            <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          <FormField
            label="New password"
            htmlFor="password"
            error={errors.password}
            hint={!errors.password ? "At least 8 characters" : undefined}
            required
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() =>
                setErrors((p) => ({
                  ...p,
                  password: validatePassword(password) ?? undefined,
                }))
              }
              disabled={loading}
              placeholder="••••••••"
              error={!!errors.password}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-muted hover:text-foreground transition-colors duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              }
            />
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="confirm"
            error={errors.confirm}
            required
          >
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() =>
                setErrors((p) => ({
                  ...p,
                  confirm:
                    password !== confirm ? "Passwords don't match" : undefined,
                }))
              }
              disabled={loading}
              placeholder="••••••••"
              error={!!errors.confirm}
            />
          </FormField>

          <div className="pt-1">
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Update password
            </Button>
          </div>

        </form>
      </div>
    </PageShell>
  );
}
