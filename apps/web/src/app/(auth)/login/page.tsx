"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

// ─── Login Form ────────────────────────────────────────────────────────────────
// Separate component so useSearchParams() is inside a Suspense boundary,
// as required by Next.js 14 App Router.

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Only honour same-origin relative redirects — prevents open-redirect attacks
  const rawRedirect = searchParams.get("redirect");
  const safeRedirect =
    rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Rule: create client directly inside the function that uses it
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Generic message — never reveal whether email or password was wrong
        setError("Invalid email or password.");
        return;
      }

      // Fetch tenantSlug + role now that the session cookie is set
      const res = await fetch("/api/auth/profile", { method: "POST" });

      if (res.status === 404 || res.status === 400) {
        // 404 = no profile row (user confirmed email before onboarding)
        // 400 = profile exists but onboarding not completed
        // In both cases, send to onboarding to complete setup.
        router.push("/onboarding");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const { tenantSlug } = (await res.json()) as {
        tenantSlug: string;
        role: string;
      };

      router.push(safeRedirect ?? `/${tenantSlug}/dashboard`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">

      {/* Atmospheric glow — top-right corner, desktop only.
          Light: forge-50 warmth felt through stone, barely visible.
          Dark:  ember glow against midnight stone. */}
      <div
        className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
        style={{ background: "var(--auth-glow)" }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[420px]">

        {/* Wordmark — above the card, centered */}
        <div className="text-center mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">
            zenzo
          </span>
        </div>

        {/* Card — flat precision, no shadow */}
        <div className="bg-surface-raised rounded-xl border border-border px-8 py-10">

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-display text-heading">Welcome back</h1>
            <p className="mt-1.5 text-body text-muted">
              Sign in to your account.
            </p>
          </div>

          {/* Error banner */}
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

            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              labelRight={
                <Link
                  href="/forgot-password"
                  className="text-caption text-brand hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              }
            >
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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

            <div className="pt-1">
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Sign in
              </Button>
            </div>

          </form>

          <p className="mt-6 text-center text-body-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand font-medium hover:underline">
              Create one free
            </Link>
          </p>

          {/*
            ─── Future auth provider slot ──────────────────────────────────────
            Adding phone OTP or Google OAuth = uncomment + implement.
            No structural changes to this card — purely additive.

            <div className="mt-6 pt-5 border-t border-border space-y-3">
              <Button variant="secondary" fullWidth>Continue with Google</Button>
              <Button variant="secondary" fullWidth>Sign in with OTP</Button>
            </div>
          */}

        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
// Suspense wrapper required by Next.js 14: useSearchParams() must be inside
// a Suspense boundary during static rendering.

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
