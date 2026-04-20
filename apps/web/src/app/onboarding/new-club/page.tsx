"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input } from "@zenzo/ui";

// ─── Constants ─────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  { value: "gym",          label: "Gym / Fitness",   emoji: "🏋️" },
  { value: "martial_arts", label: "Martial Arts",    emoji: "🥋" },
  { value: "dance",        label: "Dance Academy",   emoji: "💃" },
  { value: "yoga",         label: "Yoga Studio",     emoji: "🧘" },
  { value: "other",        label: "Other",           emoji: "✦"  },
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

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

type Step = 1 | 2 | 3 | 4;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewClubPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>(1);
  const [authLoading, setAuthLoading] = useState(true);

  // Step 1 — business type
  const [businessType, setBusinessType] = useState<string | null>(null);

  // Step 2 — studio details
  const [studioName, setStudioName]     = useState("");
  const [slug, setSlug]                 = useState("");
  const [slugEdited, setSlugEdited]     = useState(false);
  const [city, setCity]                 = useState("");
  const [step2Errors, setStep2Errors]   = useState<{ name?: string; slug?: string; form?: string }>({});
  const [step2Loading, setStep2Loading] = useState(false);

  // Club (set after step 2)
  const [clubId, setClubId]     = useState<string | null>(null);
  const [clubSlug, setClubSlug] = useState<string | null>(null);

  // Step 3 — first batch (optional)
  const [batchName, setBatchName]       = useState("Morning Batch");
  const [startTime, setStartTime]       = useState("06:00");
  const [endTime, setEndTime]           = useState("07:30");
  const [batchDays, setBatchDays]       = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [step3Errors, setStep3Errors]   = useState<{ form?: string }>({});
  const [step3Loading, setStep3Loading] = useState(false);

  // Auth guard — redirect if not logged in
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
      setAuthLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(studioName));
  }, [studioName, slugEdited]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleStep2Next() {
    const nameErr = studioName.trim() ? null : "Studio name is required";
    const slugErr = slug.trim()
      ? /^[a-z0-9-]+$/.test(slug) ? null : "Only lowercase letters, numbers, and hyphens"
      : "URL is required";

    if (nameErr || slugErr) {
      setStep2Errors({ name: nameErr ?? undefined, slug: slugErr ?? undefined });
      return;
    }

    if (clubId) { setStep(3); return; }

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
    if (!batchName.trim()) { setStep3Errors({ form: "Batch name is required." }); return; }
    if (!batchDays.length) { setStep3Errors({ form: "Select at least one day." }); return; }

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

  function toggleDay(day: string) {
    setBatchDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-border border-t-brand animate-spin" />
      </div>
    );
  }

  const totalSteps = 3;

  return (
    <div className="relative min-h-screen bg-surface-subtle flex items-center justify-center p-6 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-48 -right-32 h-[640px] w-[640px] rounded-full hidden lg:block"
        style={{ background: "var(--auth-glow)" }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[540px]">
        <div className="text-center mb-8">
          <span className="text-[26px] font-bold tracking-tight text-brand">zenzo</span>
          <p className="text-body text-muted mt-1">Create a new club</p>
        </div>

        {step <= totalSteps && (
          <div className="flex items-center justify-center gap-2 mb-6" aria-label={`Step ${step} of ${totalSteps}`}>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={[
                  "rounded-full transition-all duration-standard",
                  s === step   ? "w-5 h-2 bg-brand"           :
                  s < step     ? "w-2 h-2 bg-brand opacity-40" :
                                 "w-2 h-2 bg-border",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">

          {/* ── Step 1: Business type ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="px-8 pt-10 pb-8">
              <div className="mb-6">
                <h1 className="text-display text-heading">What kind of club?</h1>
                <p className="mt-1.5 text-body text-muted">We'll set up the right defaults for you.</p>
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
                      <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>
                      <span className={`text-body-sm font-medium ${selected ? "text-brand" : "text-foreground"}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <Button fullWidth size="lg" disabled={!businessType} onClick={() => businessType && setStep(2)}>
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-body-sm text-muted hover:text-foreground transition-colors duration-standard mx-auto"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Back
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Studio setup ──────────────────────────────────────────── */}
          {step === 2 && (
            <div className="px-8 pt-10 pb-8">
              <div className="mb-6">
                <h1 className="text-display text-heading">Set up your club</h1>
                <p className="mt-1.5 text-body text-muted">Give your new club a name and URL.</p>
              </div>

              {step2Errors.form && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                  {step2Errors.form}
                </div>
              )}

              <div className="space-y-5 mb-8">
                <FormField label="Club name" htmlFor="studioName" error={step2Errors.name} required>
                  <Input
                    id="studioName"
                    type="text"
                    autoComplete="organization"
                    required
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    onBlur={() => setStep2Errors((p) => ({ ...p, name: studioName.trim() ? undefined : "Club name is required" }))}
                    disabled={step2Loading}
                    placeholder="Ravi's East Branch"
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
                          ? /^[a-z0-9-]+$/.test(slug) ? undefined : "Only lowercase letters, numbers, and hyphens"
                          : "URL is required",
                      }))
                    }
                    disabled={step2Loading}
                    placeholder="ravis-east"
                    error={!!step2Errors.slug}
                  />
                </FormField>

                <FormField label="City" htmlFor="city" hint="Optional">
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

          {/* ── Step 3: First batch (skippable) ────────────────────────────────── */}
          {step === 3 && (
            <div className="px-8 pt-10 pb-8">
              <div className="mb-6">
                <h1 className="text-display text-heading">Create your first batch</h1>
                <p className="mt-1.5 text-body text-muted">You can add more batches from the dashboard.</p>
              </div>

              {step3Errors.form && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg bg-error border border-error-accent px-4 py-3 text-body-sm text-error-foreground">
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
                    <Input id="startTime" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={step3Loading} />
                  </FormField>
                  <FormField label="End time" htmlFor="endTime" required>
                    <Input id="endTime" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={step3Loading} />
                  </FormField>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-label font-medium uppercase tracking-[0.05em] text-muted">Days</span>
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
                  onClick={() => setStep(4)}
                  disabled={step3Loading}
                  className="block text-body-sm text-muted hover:text-foreground transition-colors duration-standard disabled:opacity-50 mx-auto"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ─────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="px-8 pt-10 pb-8 text-center space-y-6">
              <div className="size-16 rounded-full bg-success flex items-center justify-center mx-auto" aria-hidden="true">
                <CheckCircle2 className="size-8 text-success-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-display text-heading">Club created!</h1>
                <p className="text-body text-muted">
                  {studioName || "Your new club"} is ready. Go to its dashboard to add members and start taking attendance.
                </p>
              </div>
              <Button fullWidth size="lg" onClick={() => router.push(clubSlug ? `/${clubSlug}/dashboard` : "/clubs")}>
                Go to dashboard
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
