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

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch {
      setError("Failed to initialize Google login.");
      setLoading(false);
    }
  }

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

      const { clubs } = (await res.json()) as {
        clubs: Array<{ slug: string; name: string; role: string }>;
      };

      if (!clubs || clubs.length === 0) {
        router.push("/onboarding");
        return;
      }

      if (clubs.length === 1) {
        const slug = clubs[0]?.slug;
        if (slug) {
          router.push(safeRedirect ?? `/${slug}/dashboard`);
          return;
        }
      }

      router.push(safeRedirect ?? "/clubs");
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

          <div className="mt-6 pt-5 border-t border-border space-y-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
            >
              <svg className="size-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </div>
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
