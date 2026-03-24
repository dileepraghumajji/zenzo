"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Check, AlertCircle, Mail } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

// ─── Validation helpers ────────────────────────────────────────────────────────

function validateFullName(v: string): string | null {
  if (!v.trim()) return "Please enter your full name";
  return null;
}

function validatePhone(v: string): string | null {
  // Strip spaces, dashes, leading +91 or 91
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

// ─── Brand panel ───────────────────────────────────────────────────────────────
// Extracted so it doesn't re-render on every keystroke in the form

const FEATURES = [
  "Members & attendance in one place",
  "Automated fee reminders via WhatsApp",
  "Know who's paid and who hasn't — instantly",
] as const;

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 relative flex-col justify-between p-12 bg-primary overflow-hidden">

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Bottom-left radial glow */}
      <div
        className="absolute -bottom-32 -left-32 size-[480px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #FDD1A3, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Wordmark */}
      <div className="relative">
        <span className="text-[26px] font-bold tracking-tight text-white">zenzo</span>
      </div>

      {/* Headline + feature list */}
      <div className="relative space-y-8">
        <h2 className="text-[38px] leading-[46px] font-bold text-white">
          Your gym.<br />
          Fully managed.<br />
          Starting now.
        </h2>
        <ul className="space-y-3" aria-label="Features">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <div
                className="size-5 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <Check className="size-3 text-white" />
              </div>
              <span className="text-[14px] text-white/80">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Social proof — NOTE: replace with real stats before launch */}
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
  );
}

// ─── Email sent state ──────────────────────────────────────────────────────────

function EmailSentScreen({ email }: { email: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[400px] text-center space-y-5">

        <div
          className="size-16 rounded-full bg-primary-subtle flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <Mail className="size-8 text-brand" />
        </div>

        <div className="space-y-2">
          <h1 className="text-h1 text-heading font-bold">Check your email</h1>
          <p className="text-body text-muted">
            We sent a confirmation link to{" "}
            <span className="text-foreground font-medium">{email}</span>.
            Click it to activate your account.
          </p>
        </div>

        <p className="text-body-sm text-muted pt-2">
          Already confirmed?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
}

// ─── Signup form ───────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName]       = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]           = useState<FieldErrors>({});
  const [loading, setLoading]         = useState(false);
  const [emailSent, setEmailSent]     = useState(false);

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

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Full validation pass — surface all errors at once before any network call
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
      // Rule: create client directly inside the function that uses it
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setErrors({ email: "Email already in use." });
        } else {
          setErrors({ form: "Something went wrong. Please try again." });
        }
        return;
      }

      // No session = email confirmation is enabled in Supabase project settings.
      // Show in-page confirmation screen instead of redirecting.
      if (!data.session) {
        setEmailSent(true);
        return;
      }

      // Session present — create the profiles row and go to onboarding
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: normalizePhone(phone),
        }),
      });

      if (!res.ok) {
        setErrors({ form: "Account created but setup failed. Please contact support." });
        return;
      }

      router.push("/onboarding");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── Email sent state swap ─────────────────────────────────────────────────
  if (emailSent) {
    return <EmailSentScreen email={email} />;
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      <BrandPanel />

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">

        {/* Mobile-only wordmark */}
        <div className="lg:hidden mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">zenzo</span>
        </div>

        <div className="w-full max-w-[400px]">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-h1 text-heading font-bold">Create your account</h1>
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
              className="mb-6 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
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

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create account
            </Button>

          </form>

        </div>
      </div>

    </div>
  );
}
