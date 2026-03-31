"use client";

// ─── CustomizationForm ────────────────────────────────────────────────────────
// Manages clubs.terminology JSON:
//   member_label        — custom term for "Member" (e.g. "Athlete", "Student")
//   progression_enabled — show/hide the Progression module
//   billing_cycle_type  — "doj" (date-of-joining) | "calendar" (1st of month)

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, FormField, Input, Switch } from "@zenzo/ui";

interface CustomizationFormProps {
  clubSlug:          string;
  memberLabel:       string;
  progressionEnabled: boolean;
  billingCycleType:  "doj" | "calendar";
}

export function CustomizationForm({
  clubSlug,
  memberLabel:       initMemberLabel,
  progressionEnabled: initProgression,
  billingCycleType:   initBillingType,
}: CustomizationFormProps) {
  const router = useRouter();

  const [memberLabel,        setMemberLabel]        = React.useState(initMemberLabel);
  const [progressionEnabled, setProgressionEnabled] = React.useState(initProgression);
  const [billingCycleType,   setBillingCycleType]   = React.useState<"doj" | "calendar">(initBillingType);

  const [isLoading, setIsLoading] = React.useState(false);
  const [saved,     setSaved]     = React.useState(false);
  const [error,     setError]     = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/settings`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          terminology_patch: {
            member_label:        memberLabel.trim() || "Member",
            progression_enabled: progressionEnabled,
            billing_cycle_type:  billingCycleType,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <FormField
        label='Member Label'
        htmlFor="memberLabel"
        hint='Replaces "Member" throughout the dashboard (e.g. "Athlete", "Student").'
      >
        <Input
          id="memberLabel"
          value={memberLabel}
          onChange={(e) => setMemberLabel(e.target.value)}
          placeholder="Member"
          maxLength={32}
        />
      </FormField>

      <div className="space-y-4 pt-1">
        <Switch
          id="progressionEnabled"
          label="Enable Progression Module"
          description="Show belt / level tracking in member profiles and sidebar."
          checked={progressionEnabled}
          onCheckedChange={setProgressionEnabled}
        />

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-foreground">Billing Cycle Start</p>
          <div className="flex gap-3">
            {(["doj", "calendar"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBillingCycleType(type)}
                className={[
                  "flex-1 rounded-lg border px-4 py-3 text-left transition-colors duration-100",
                  billingCycleType === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                ].join(" ")}
              >
                <p className="text-[13px] font-semibold text-foreground">
                  {type === "doj" ? "Date of Joining" : "Calendar Month"}
                </p>
                <p className="text-[12px] text-muted mt-0.5">
                  {type === "doj"
                    ? "Cycle resets on the same day each month as join date."
                    : "Cycle resets on the 1st of each calendar month."}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-[13px] text-error-foreground">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save Changes"}
        </Button>
        {saved && (
          <p className="text-[13px] text-success-foreground font-medium">Saved ✓</p>
        )}
      </div>
    </form>
  );
}
