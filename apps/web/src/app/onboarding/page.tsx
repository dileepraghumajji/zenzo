"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Plus, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

// ─── Constants ─────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  { value: "gym",          label: "Gym / Fitness",   emoji: "🏋️" },
  { value: "martial_arts", label: "Martial Arts",    emoji: "🥋" },
  { value: "dance",        label: "Dance Academy",   emoji: "💃" },
  { value: "tuition",      label: "Tuition Centre",  emoji: "📚" },
  { value: "yoga",         label: "Yoga Studio",     emoji: "🧘" },
  { value: "other",        label: "Other",           emoji: "✦" },
] as const;

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

// Steps 1–4 are wizard steps (progress dots shown).
// Step 5 is the completion screen (no active dot).
type Step = 1 | 2 | 3 | 4 | 5;

type Invitee = { email: string; name: string };

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // ── Wizard state ─────────────────────────────────────────────────────────────

  const [step, setStep]               = useState<Step>(1);
  const [initLoading, setInitLoading] = useState(true);

  // Step 1 — business type
  const [businessType, setBusinessType] = useState<string | null>(null);

  // Step 2 — studio details
  const [studioName, setStudioName]     = useState("");
  const [slug, setSlug]                 = useState("");
  const [slugEdited, setSlugEdited]     = useState(false);
  const [city, setCity]                 = useState("");
  const [step2Errors, setStep2Errors]   = useState<{ name?: string; slug?: string; form?: string }>({});
  const [step2Loading, setStep2Loading] = useState(false);

  // Club (set after step 2 completes)
  const [clubId, setClubId]     = useState<string | null>(null);
  const [clubSlug, setClubSlug] = useState<string | null>(null);

  // Step 3 — first batch (optional)
  const [batchName, setBatchName]       = useState("Morning Batch");
  const [startTime, setStartTime]       = useState("06:00");
  const [endTime, setEndTime]           = useState("07:30");
  const [batchDays, setBatchDays]       = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [step3Errors, setStep3Errors]   = useState<{ form?: string }>({});
  const [step3Loading, setStep3Loading] = useState(false);

  // Step 4 — invite members (optional)
  const [invitees, setInvitees]         = useState<Invitee[]>([{ email: "", name: "" }]);
  const [step4Loading, setStep4Loading] = useState(false);
  const [step4Error, setStep4Error]     = useState<string | null>(null);

  // ── On mount: skip wizard if user already has a club ─────────────────────────

  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: staff } = await supabase
        .from("club_staff")
        .select("club_id")
        .eq("user_id", user.id)
        .limit(1);

      if (staff && staff.length > 0) {
        const { data: club } = await supabase
          .from("clubs")
          .select("slug")
          .eq("id", staff[0]!.club_id)
          .single();

        if (club) {
          router.replace(`/${club.slug}/dashboard`);
          return;
        }
      }

      setInitLoading(false);
    })();
  }, [router]);

  // ── Auto-derive slug from studio name ────────────────────────────────────────

  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(studioName));
  }, [studioName, slugEdited]);

  // ── Step handlers ─────────────────────────────────────────────────────────────

  function handleStep1Next() {
    if (businessType) setStep(2);
  }

  async function handleStep2Next() {
    const nameErr = studioName.trim() ? null : "Studio name is required";
    const slugErr = slug.trim()
      ? /^[a-z0-9-]+$/.test(slug) ? null : "Only lowercase letters, numbers, and hyphens"
      : "URL is required";

    if (nameErr || slugErr) {
      setStep2Errors({ name: nameErr ?? undefined, slug: slugErr ?? undefined });
      return;
    }

    // Club already created (user went back) — just advance
    if (clubId) {
      setStep(3);
      return;
    }

    setStep2Errors({});
    setStep2Loading(true);

    try {
      const res = await fetch("/api/onboarding/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: studioName.trim(),
          slug: slug.trim(),
          city: city.trim() || null,
          business_type: businessType ?? "gym",
        }),
      });

      if (res.status === 409) {
        setStep2Errors({ slug: "This URL is already taken. Try another." });
        return;
      }

      if (!res.ok) {
        setStep2Errors({ form: "Couldn't create your studio. Please try again." });
        return;
      }

      const json = (await res.json()) as { clubSlug: string; clubId: string };
      setClubId(json.clubId);
      setClubSlug(json.clubSlug);
      setStep(3);
    } catch {
      setStep2Errors({ form: "Something went wrong. Please try again." });
    } finally {
      setStep2Loading(false);
    }
  }

  async function handleStep3Next() {
    if (!clubId) return;

    if (!batchName.trim()) {
      setStep3Errors({ form: "Batch name is required." });
      return;
    }
    if (!batchDays.length) {
      setStep3Errors({ form: "Select at least one day." });
      return;
    }

    setStep3Errors({});
    setStep3Loading(true);

    try {
      const res = await fetch("/api/onboarding/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: clubId,
          name: batchName.trim(),
          start_time: startTime,
          end_time: endTime,
          days: batchDays,
        }),
      });

      if (!res.ok) {
        setStep3Errors({ form: "Couldn't create the batch. You can add it later." });
        return;
      }

      setStep(4);
    } catch {
      setStep3Errors({ form: "Something went wrong. You can add batches later." });
    } finally {
      setStep3Loading(false);
    }
  }

  function handleStep3Skip() {
    setStep(4);
  }

  async function handleStep4Next() {
    if (!clubId) return;

    const filled = invitees.filter((inv) => inv.email.trim());

    if (filled.length === 0) {
      // Nothing entered — treat as skip
      setStep(5);
      return;
    }

    setStep4Loading(true);
    setStep4Error(null);

    try {
      await fetch("/api/onboarding/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: clubId, invitees: filled }),
      });
    } catch {
      setStep4Error("Invites couldn't be saved. You can add members from your dashboard.");
    } finally {
      setStep4Loading(false);
      setStep(5);
    }
  }

  function handleStep4Skip() {
    setStep(5);
  }

  function handleFinish() {
    router.push(clubSlug ? `/${clubSlug}/dashboard` : "/");
  }

  // ── Invitee helpers ───────────────────────────────────────────────────────────

  function toggleDay(day: string) {
    setBatchDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function addInvitee() {
    if (invitees.length < 5) {
      setInvitees((prev) => [...prev, { email: "", name: "" }]);
    }
  }

  function removeInvitee(index: number) {
    setInvitees((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInvitee(index: number, field: "email" | "name", value: string) {
    setInvitees((prev) =>
      prev.map((inv, i) => (i === index ? { ...inv, [field]: value } : inv))
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (initLoading) {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center">
        <div
          className="size-8 rounded-full border-2 border-border border-t-brand animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  // ── Wizard layout ─────────────────────────────────────────────────────────────

  // 4 wizard steps shown with progress dots. Step 5 is the completion screen.
  const totalSteps = 4;

  return (
    <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">

      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
        style={{ background: "var(--auth-glow)" }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[540px]">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">
            zenzo
          </span>
        </div>

        {/* Progress dots — hidden on completion screen */}
        {step <= totalSteps && (
          <div
            className="flex items-center justify-center gap-2 mb-6"
            aria-label={`Step ${step} of ${totalSteps}`}
          >
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={[
                  "rounded-full transition-all duration-standard",
                  s === step
                    ? "w-5 h-2 bg-brand"
                    : s < step
                    ? "w-2 h-2 bg-brand opacity-40"
                    : "w-2 h-2 bg-border",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">

          {/* ── Step 1: Business type ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="px-8 pt-10 pb-8">
              <div className="mb-6">
                <h1 className="text-display text-heading">Your business type</h1>
                <p className="mt-1.5 text-body text-muted">
                  This helps us set up the right defaults for you.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {BUSINESS_TYPES.map(({ value, label, emoji }) => {
                  const selected = businessType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBusinessType(value)}
                      className={[
                        "flex flex-col items-center gap-2 rounded-md border px-4 py-5",
                        "transition-colors duration-standard text-center",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "border-primary bg-primary-subtle"
                          : "border-border bg-background hover:border-border-strong hover:bg-surface-subtle",
                      ].join(" ")}
                      aria-pressed={selected}
                    >
                      <span className="text-2xl leading-none" aria-hidden="true">
                        {emoji}
                      </span>
                      <span className={`text-body-sm font-medium ${selected ? "text-brand" : "text-foreground"}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button fullWidth size="lg" disabled={!businessType} onClick={handleStep1Next}>
                Continue
              </Button>
            </div>
          )}

          {/* ── Step 2: Studio setup ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="px-8 pt-10 pb-8">
              <div className="mb-6">
                <h1 className="text-display text-heading">Set up your studio</h1>
                <p className="mt-1.5 text-body text-muted">
                  This is how members and staff will find you.
                </p>
              </div>

              {step2Errors.form && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
                >
                  <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                  {step2Errors.form}
                </div>
              )}

              <div className="space-y-5 mb-8">
                <FormField label="Studio name" htmlFor="studioName" error={step2Errors.name} required>
                  <Input
                    id="studioName"
                    type="text"
                    autoComplete="organization"
                    required
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    onBlur={() =>
                      setStep2Errors((p) => ({
                        ...p,
                        name: studioName.trim() ? undefined : "Studio name is required",
                      }))
                    }
                    disabled={step2Loading}
                    placeholder="Ravi's Fitness Hub"
                    error={!!step2Errors.name}
                  />
                </FormField>

                <FormField
                  label="Your URL"
                  htmlFor="slug"
                  error={step2Errors.slug}
                  hint={!step2Errors.slug && slug ? `zenzo.app/${slug}` : undefined}
                  required
                >
                  <Input
                    id="slug"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      setSlugEdited(true);
                    }}
                    onBlur={() =>
                      setStep2Errors((p) => ({
                        ...p,
                        slug: slug.trim()
                          ? /^[a-z0-9-]+$/.test(slug)
                            ? undefined
                            : "Only lowercase letters, numbers, and hyphens"
                          : "URL is required",
                      }))
                    }
                    disabled={step2Loading}
                    placeholder="ravis-fitness"
                    error={!!step2Errors.slug}
                  />
                </FormField>

                <FormField label="City" htmlFor="city" hint="Optional — sets timezone defaults">
                  <Input
                    id="city"
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={step2Loading}
                    placeholder="Hyderabad"
                  />
                </FormField>
              </div>

              <div className="space-y-3">
                <Button fullWidth size="lg" loading={step2Loading} onClick={handleStep2Next}>
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={step2Loading}
                  className="flex items-center gap-1.5 text-body-sm text-muted hover:text-foreground transition-colors duration-standard disabled:opacity-50 mx-auto"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Back
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: First batch (skippable) ───────────────────────────── */}
          {step === 3 && (
            <div className="px-8 pt-10 pb-8">
              <div className="mb-6">
                <h1 className="text-display text-heading">Create your first batch</h1>
                <p className="mt-1.5 text-body text-muted">
                  A batch is a group of members who train at the same time.
                </p>
              </div>

              {step3Errors.form && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
                >
                  <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                  {step3Errors.form}
                </div>
              )}

              <div className="space-y-5 mb-8">
                <FormField label="Batch name" htmlFor="batchName" required>
                  <Input
                    id="batchName"
                    type="text"
                    required
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    disabled={step3Loading}
                    placeholder="Morning Batch"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start time" htmlFor="startTime" required>
                    <Input
                      id="startTime"
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={step3Loading}
                    />
                  </FormField>
                  <FormField label="End time" htmlFor="endTime" required>
                    <Input
                      id="endTime"
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={step3Loading}
                    />
                  </FormField>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-label font-medium uppercase tracking-[0.05em] text-muted">
                    Days
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map(({ key, label }) => {
                      const active = batchDays.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleDay(key)}
                          disabled={step3Loading}
                          aria-pressed={active}
                          className={[
                            "h-9 w-12 rounded-md border text-body-sm font-medium",
                            "transition-colors duration-standard",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            active
                              ? "border-primary bg-primary-subtle text-brand"
                              : "border-border bg-background text-muted hover:border-border-strong hover:text-foreground",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button fullWidth size="lg" loading={step3Loading} onClick={handleStep3Next}>
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={handleStep3Skip}
                  disabled={step3Loading}
                  className="block text-body-sm text-muted hover:text-foreground transition-colors duration-standard disabled:opacity-50 mx-auto"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Invite first members (skippable) ──────────────────── */}
          {step === 4 && (
            <div className="px-8 pt-10 pb-8">
              <div className="mb-6">
                <h1 className="text-display text-heading">Invite your first members</h1>
                <p className="mt-1.5 text-body text-muted">
                  Add their emails. They&apos;ll get an invite to sign up. You can add more from your dashboard anytime.
                </p>
              </div>

              {step4Error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground"
                >
                  <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                  {step4Error}
                </div>
              )}

              <div className="space-y-4 mb-5">
                {invitees.map((inv, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="member@example.com"
                        value={inv.email}
                        onChange={(e) => updateInvitee(i, "email", e.target.value)}
                        disabled={step4Loading}
                        autoComplete="off"
                      />
                      <Input
                        type="text"
                        placeholder="Name (optional)"
                        value={inv.name}
                        onChange={(e) => updateInvitee(i, "name", e.target.value)}
                        disabled={step4Loading}
                      />
                    </div>
                    {invitees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvitee(i)}
                        disabled={step4Loading}
                        aria-label="Remove invitee"
                        className="mt-2.5 p-1 text-muted hover:text-foreground transition-colors duration-standard disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {invitees.length < 5 && (
                <button
                  type="button"
                  onClick={addInvitee}
                  disabled={step4Loading}
                  className="flex items-center gap-1.5 text-body-sm text-brand hover:text-brand/80 transition-colors duration-standard disabled:opacity-50 mb-8 focus-visible:outline-none"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add another
                </button>
              )}

              <div className="space-y-3">
                <Button fullWidth size="lg" loading={step4Loading} onClick={handleStep4Next}>
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={handleStep4Skip}
                  disabled={step4Loading}
                  className="block text-body-sm text-muted hover:text-foreground transition-colors duration-standard disabled:opacity-50 mx-auto"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: All set ────────────────────────────────────────────── */}
          {step === 5 && (
            <div className="px-8 pt-10 pb-8 text-center space-y-6">

              <div
                className="size-16 rounded-full bg-success flex items-center justify-center mx-auto"
                aria-hidden="true"
              >
                <CheckCircle2 className="size-8 text-success-foreground" />
              </div>

              <div className="space-y-2">
                <h1 className="text-display text-heading">You&apos;re all set</h1>
                <p className="text-body text-muted">
                  {studioName || "Your studio"} is ready. Add members and start taking attendance.
                </p>
              </div>

              <Button fullWidth size="lg" onClick={handleFinish}>
                Go to dashboard
              </Button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
