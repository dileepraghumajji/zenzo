"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

// ─── Validation helpers ────────────────────────────────────────────────────────

function validateFullName(v: string): string | null {
  if (!v.trim()) return "Please enter your full name";
  return null;
}

function validatePhone(v: string): string | null {
  const normalized = v.replace(/[\s\-]/g, "");
  const digits = normalized.startsWith("+91")
    ? normalized.slice(3)
    : normalized.startsWith("91") && normalized.length === 12
    ? normalized.slice(2)
    : normalized;
  if (!/^\d{10}$/.test(digits)) return "Enter a valid 10-digit number";
  return null;
}

function validateEmail(v: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
  return null;
}

function validatePassword(v: string): string | null {
  if (v.length < 8) return "Password must be at least 8 characters";
  return null;
}

function normalizePhone(v: string): string {
  const normalized = v.replace(/[\s\-]/g, "");
  if (normalized.startsWith("+91")) return normalized.slice(3);
  if (normalized.startsWith("91") && normalized.length === 12) return normalized.slice(2);
  return normalized;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type FieldErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  form?: string;
};

// ─── Email sent state ──────────────────────────────────────────────────────────

function EmailSentScreen({ email }: { email: string }) {
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
            <Mail className="size-7 text-brand" />
          </div>

          <div className="space-y-2">
            <h1 className="text-h2 text-heading">Check your email</h1>
            <p className="text-body text-muted leading-6">
              We sent a confirmation link to{" "}
              <span className="text-foreground font-medium">{email}</span>.
              Click it to activate your account.
            </p>
          </div>

          <p className="text-body-sm text-muted pt-1">
            Already confirmed?{" "}
            <Link href="/login" className="text-brand font-medium hover:underline">
              Log in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

// ─── Signup form ───────────────────────────────────────────────────────────────
// Separate component so useSearchParams() is inside a Suspense boundary.

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [fullName, setFullName]         = useState("");
  const [phone, setPhone]               = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState<FieldErrors>({});
  const [loading, setLoading]           = useState(false);
  const [emailSent, setEmailSent]       = useState(false);

  // ── Blur validation — validates a single field when user leaves it ──────────
  function handleBlur(field: keyof Omit<FieldErrors, "form">) {
    const value = { fullName, phone, email, password }[field];
    const validators = {
      fullName: validateFullName,
      phone:    validatePhone,
      email:    validateEmail,
      password: validatePassword,
    };
    const error = validators[field](value);
    setErrors((prev) => ({ ...prev, [field]: error ?? undefined }));
  }

  // ── Google Auth ────────────────────────────────────────────────────────────
  async function handleGoogleLogin() {
    setLoading(true);
    setErrors({});
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
      setErrors({ form: "Failed to initialize Google login." });
      setLoading(false);
    }
  }

  // ── Submit Form ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Full validation pass — surface all errors at once
    const next: FieldErrors = {
      fullName: validateFullName(fullName) ?? undefined,
      phone:    validatePhone(phone)       ?? undefined,
      email:    validateEmail(email)       ?? undefined,
      password: validatePassword(password) ?? undefined,
    };

    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: normalizePhone(phone),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setErrors({ email: "Email already in use." });
        } else {
          setErrors({ form: signUpError.message || "Signup failed. Please try again." });
        }
        return;
      }

      // Handle email confirmation if needed
      if (!authData.session) {
        setEmailSent(true);
        return;
      }

      // If user arrived via an invite link, activate the membership.
      if (inviteToken) {
        await fetch(`/api/auth/activate-invite?token=${encodeURIComponent(inviteToken)}`, {
          method: "POST",
        });
      }

      // The handle_new_user() trigger auto-creates the users row.
      // Members and new users go to /portal; owners start onboarding from there.
      router.push("/portal");
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return <EmailSentScreen email={email} />;
  }

  return (
    <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">

      {/* Atmospheric glow — top-right, desktop only */}
      <div
        className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
        style={{ background: "var(--auth-glow)" }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[440px]">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">
            zenzo
          </span>
        </div>

        {/* Card */}
        <div className="bg-surface-raised rounded-xl border border-border px-8 py-10">

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-display text-heading">Create your account</h1>
            <p className="mt-1.5 text-body text-muted">
              Already have one?{" "}
              <Link href="/login" className="text-brand font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>

          {/* Form-level error */}
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
              label="Full Name"
              htmlFor="fullName"
              error={errors.fullName}
              required
            >
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName")}
                disabled={loading}
                placeholder="Rahul Sharma"
                error={!!errors.fullName}
              />
            </FormField>

            <FormField
              label="Phone"
              htmlFor="phone"
              error={errors.phone}
              required
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone")}
                disabled={loading}
                placeholder="98765 43210"
                error={!!errors.phone}
                prefix={
                  <span className="text-body-sm font-medium text-muted select-none">
                    +91
                  </span>
                }
              />
            </FormField>

            <FormField
              label="Email"
              htmlFor="email"
              error={errors.email}
              required
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                disabled={loading}
                placeholder="you@example.com"
                error={!!errors.email}
              />
            </FormField>

            <FormField
              label="Password"
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
                onBlur={() => handleBlur("password")}
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

            <div className="pt-1">
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Create account
              </Button>
            </div>

          </form>

          <p className="mt-4 text-center text-body-sm text-muted">
            <Link href="/explore" className="text-brand hover:underline">
              Explore clubs →
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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
