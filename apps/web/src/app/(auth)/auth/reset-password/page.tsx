"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to reset password. Your link might be invalid or expired.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
          style={{ background: "var(--auth-glow)" }}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-[420px]">
          <div className="text-center mb-8">
            <span className="text-[26px] font-bold tracking-tight text-brand">zenzo</span>
          </div>

          <div className="bg-surface-raised rounded-xl border border-border px-8 py-10 text-center space-y-5">
            <div
              className="size-14 rounded-full bg-primary-subtle flex items-center justify-center mx-auto"
              aria-hidden="true"
            >
              <CheckCircle2 className="size-7 text-brand" />
            </div>

            <div className="space-y-2">
              <h1 className="text-h2 text-heading">Password updated</h1>
              <p className="text-body text-muted leading-6">
                Your password has been successfully reset. You will be redirected to the login page momentarily.
              </p>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-body-sm text-brand hover:underline transition-colors duration-standard"
              >
                Go to login now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
        style={{ background: "var(--auth-glow)" }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[420px]">
        <div className="text-center mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">zenzo</span>
        </div>

        <div className="bg-surface-raised rounded-xl border border-border px-8 py-8">
          <div className="mb-6">
            <h1 className="text-display text-heading">Set new password</h1>
            <p className="mt-1.5 text-body text-muted">
              Choose a strong password to secure your account.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
            >
              <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField label="New Password" htmlFor="password">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
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
            
            <FormField label="Confirm Password" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
              />
            </FormField>

            <div className="pt-1">
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Update password
              </Button>
            </div>
          </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
