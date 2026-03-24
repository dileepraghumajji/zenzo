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

      if (!res.ok) {
        setError("Account not found. Please contact your administrator.");
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
    <div className="min-h-screen flex">

      {/* ── Left panel — brand story (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 relative flex-col justify-between p-12 bg-primary overflow-hidden">

        {/* Dot grid texture — gives depth without clutter */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        {/* Radial glow — bottom-left warmth */}
        <div
          className="absolute -bottom-32 -left-32 size-[480px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #FDD1A3, transparent 70%)" }}
          aria-hidden="true"
        />

        {/* Wordmark */}
        <div className="relative">
          <span className="text-[26px] font-bold tracking-tight text-white">
            zenzo
          </span>
        </div>

        {/* Headline */}
        <div className="relative space-y-4">
          <h2 className="text-[38px] leading-[46px] font-bold text-white">
            Stop chasing fees.<br />
            Start growing<br />
            your gym.
          </h2>
          <p className="text-[15px] leading-6 text-white/70 max-w-[320px]">
            Members, attendance, payments — managed in one place built for Indian gyms.
          </p>
        </div>

        {/* Social proof */}
        {/* NOTE: placeholder copy — replace with real stats before launch */}
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden="true">
              {["R", "A", "S", "M"].map((initial) => (
                <div
                  key={initial}
                  className="size-8 rounded-full bg-white/20 border-2 border-primary/60 flex items-center justify-center text-white text-[11px] font-bold"
                >
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-white/70">
              Trusted by{" "}
              <span className="text-white font-semibold">500+ gym owners</span> across India
            </p>
          </div>

          <figure className="border-l-2 border-white/25 pl-4 space-y-1">
            <blockquote className="text-[13px] text-white/80 italic leading-5">
              "Zenzo saved me 3 hours a day on fee collection alone."
            </blockquote>
            <figcaption className="text-[12px] text-white/50">
              Rahul Sharma — Fitness First, Mumbai
            </figcaption>
          </figure>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">

        {/* Mobile-only wordmark */}
        <div className="lg:hidden mb-10">
          <span className="text-[26px] font-bold tracking-tight text-brand">
            zenzo
          </span>
        </div>

        <div className="w-full max-w-[400px]">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-h1 text-heading font-bold">Welcome back</h1>
            <p className="mt-1.5 text-body text-muted">
              Sign in to your account to continue.
            </p>
          </div>

          {/* Error banner — TODO: replace with Toast when Task 15 ships */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
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
                  className="text-brand hover:underline"
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

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign in
            </Button>

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
              <Button variant="secondary" fullWidth>Sign in with OTP</Button>
              <Button variant="secondary" fullWidth>Continue with Google</Button>
            </div>
          */}
        </div>

      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
// Suspense wrapper is required by Next.js 14: any component using
// useSearchParams() must be wrapped in <Suspense>.

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
