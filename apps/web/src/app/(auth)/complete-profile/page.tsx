"use client";

// ─── CompleteProfile ──────────────────────────────────────────────────────────
//
// Shown after Google OAuth when phone is missing from the user's profile.
// Users fill in phone (and can correct their display name).
// On submit: updates public.users via Supabase client (update own row RLS).
// Then routes to the appropriate destination.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button, FormField, Input } from "@zenzo/ui";
import { AlertCircle } from "lucide-react";

function validatePhone(v: string): string | null {
  const normalized = v.replace(/[\s\-]/g, "");
  const digits = normalized.startsWith("+91")
    ? normalized.slice(3)
    : normalized.startsWith("91") && normalized.length === 12
    ? normalized.slice(2)
    : normalized;
  if (!/^\d{10}$/.test(digits)) return "Enter a valid 10-digit Indian mobile number";
  return null;
}

function normalizePhone(v: string): string {
  const normalized = v.replace(/[\s\-]/g, "");
  if (normalized.startsWith("+91")) return normalized.slice(3);
  if (normalized.startsWith("91") && normalized.length === 12) return normalized.slice(2);
  return normalized;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [fullName, setFullName] = useState("");
  const [phone,    setPhone]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; form?: string }>({});

  // Pre-fill name from existing users row (Google may have set it to 'User')
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("users")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      // Pre-fill name, but clear the placeholder 'User'
      const name = profile?.full_name && profile.full_name !== "User"
        ? profile.full_name
        : user.user_metadata?.name ?? user.user_metadata?.full_name ?? "";
      setFullName(name);

      // If phone already collected, they shouldn't be here — redirect
      if (profile?.phone) {
        router.replace("/portal");
        return;
      }

      setInitDone(true);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const phoneError = validatePhone(phone);
    if (phoneError) { setErrors({ phone: phoneError }); return; }
    if (!fullName.trim()) { setErrors({ form: "Please enter your full name." }); return; }

    setErrors({});
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          phone: normalizePhone(phone),
        })
        .eq("id", user.id);

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      // Route to appropriate destination via profile API
      const res = await fetch("/api/auth/profile", { method: "POST" });
      const data = await res.json() as { destination?: string };
      router.push(data.destination ?? "/portal");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (!initDone) {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">

        <div className="text-center mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">zenzo</span>
        </div>

        <div className="bg-surface-raised rounded-xl border border-border px-8 py-10">

          <div className="mb-6">
            <h1 className="text-display text-heading">Complete your profile</h1>
            <p className="mt-1.5 text-body text-muted">
              Just a few more details to get you started.
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

            <FormField label="Full Name" htmlFor="fullName" required>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                placeholder="Rahul Sharma"
              />
            </FormField>

            <FormField
              label="Phone"
              htmlFor="phone"
              error={errors.phone}
              required
              hint={!errors.phone ? "Used for WhatsApp notifications" : undefined}
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors({}); }}
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

            <div className="pt-1">
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Continue
              </Button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
