"use client";

// ─── CreateBatchForm ─────────────────────────────────────────────────────────
//
// Create Batch form. Submitted to POST /api/batches.
//
// Fields:
//   - Batch name (required)
//   - Start time (required)
//   - End time (required, must be after start)
//   - Days (required, multi-toggle pills, default Mon–Fri)
//   - Coach (optional select)
//   - Max capacity (optional number)
//   - Description (optional)

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormField,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  cn,
} from "@zenzo/ui";
import { DayOfWeek, StaffRole } from "@zenzo/database/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coach {
  id: string;
  full_name: string;
  role: StaffRole;
}

interface CreateBatchFormProps {
  clubSlug: string;
  coaches: Coach[];
}

// ─── Day config ───────────────────────────────────────────────────────────────

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: DayOfWeek.Mon, label: "Monday",    short: "M" },
  { value: DayOfWeek.Tue, label: "Tuesday",   short: "T" },
  { value: DayOfWeek.Wed, label: "Wednesday", short: "W" },
  { value: DayOfWeek.Thu, label: "Thursday",  short: "T" },
  { value: DayOfWeek.Fri, label: "Friday",    short: "F" },
  { value: DayOfWeek.Sat, label: "Saturday",  short: "S" },
  { value: DayOfWeek.Sun, label: "Sunday",    short: "S" },
];

const DEFAULT_DAYS: DayOfWeek[] = [
  DayOfWeek.Mon, DayOfWeek.Tue, DayOfWeek.Wed, DayOfWeek.Thu, DayOfWeek.Fri,
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateBatchForm({ clubSlug, coaches }: CreateBatchFormProps) {
  const router = useRouter();

  const [name,        setName]        = React.useState("");
  const [startTime,   setStartTime]   = React.useState("06:00");
  const [endTime,     setEndTime]     = React.useState("07:30");
  const [days,        setDays]        = React.useState<DayOfWeek[]>(DEFAULT_DAYS);
  const [coachId,     setCoachId]     = React.useState("");
  const [maxCapacity, setMaxCapacity] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [errors,    setErrors]    = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // ── Toggle a day ────────────────────────────────────────────────────────
  function toggleDay(day: DayOfWeek) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setErrors((e) => ({ ...e, days: "" }));
  }

  // ── Validation ──────────────────────────────────────────────────────────
  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim())   next.name = "Batch name is required";
    if (!startTime)     next.startTime = "Start time is required";
    if (!endTime)       next.endTime = "End time is required";
    if (startTime && endTime && startTime >= endTime) {
      next.endTime = "End time must be after start time";
    }
    if (days.length === 0) next.days = "Select at least one day";
    if (maxCapacity && (isNaN(Number(maxCapacity)) || Number(maxCapacity) < 1)) {
      next.maxCapacity = "Capacity must be a positive number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubSlug,
          name:        name.trim(),
          startTime:   startTime + ":00",
          endTime:     endTime + ":00",
          days,
          coachId:     coachId || null,
          maxCapacity: maxCapacity ? Number(maxCapacity) : null,
          description: description.trim() || null,
        }),
      });

      const data = (await res.json()) as { batchId?: string; error?: string };

      if (res.ok && data.batchId) {
        router.push(`/${clubSlug}/batches/${data.batchId}`);
        return;
      }

      setErrors({ form: data.error ?? "Failed to create batch. Please try again." });
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* ── Batch Name ──────────────────────────────────────────────────── */}
      <FormField label="Batch Name" htmlFor="name" required error={errors.name}>
        <Input
          id="name"
          type="text"
          placeholder="e.g. Morning Batch"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          autoComplete="off"
        />
      </FormField>

      {/* ── Timing ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start Time" htmlFor="startTime" required error={errors.startTime}>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            error={!!errors.startTime}
          />
        </FormField>
        <FormField label="End Time" htmlFor="endTime" required error={errors.endTime}>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            error={!!errors.endTime}
          />
        </FormField>
      </div>

      {/* ── Days ────────────────────────────────────────────────────────── */}
      <FormField label="Days" htmlFor="days" required error={errors.days}>
        <div className="flex gap-2 flex-wrap" id="days">
          {DAYS.map((day) => {
            const active = days.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                aria-label={day.label}
                aria-pressed={active}
                onClick={() => toggleDay(day.value)}
                className={cn(
                  "w-11 h-11 rounded-full text-[13px] font-semibold transition-colors duration-100",
                  "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted border-border hover:bg-surface-subtle"
                )}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      </FormField>

      {/* ── Coach ───────────────────────────────────────────────────────── */}
      <FormField label="Coach" htmlFor="coachId">
        <Select value={coachId} onValueChange={setCoachId}>
          <SelectTrigger id="coachId" placeholder="Select coach (optional)…" />
          <SelectContent>
            {coaches.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-muted">
                No coaches added yet.
              </div>
            ) : (
              coaches.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.full_name}
                  {c.role === StaffRole.Owner && (
                    <span className="text-muted ml-1">(Owner)</span>
                  )}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </FormField>

      {/* ── Max Capacity ────────────────────────────────────────────────── */}
      <FormField
        label="Max Capacity"
        htmlFor="maxCapacity"
        error={errors.maxCapacity}
      >
        <Input
          id="maxCapacity"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="e.g. 20 (optional)"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          error={!!errors.maxCapacity}
        />
      </FormField>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <FormField label="Description" htmlFor="description">
        <textarea
          id="description"
          placeholder="Optional notes about this batch…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={cn(
            "w-full rounded-xl border border-border bg-background px-4 py-3",
            "text-[14px] text-foreground placeholder:text-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "resize-none transition-colors duration-100"
          )}
        />
      </FormField>

      {/* ── Form-level error ─────────────────────────────────────────────── */}
      {errors.form && (
        <p role="alert" className="text-[13px] text-error-foreground">
          {errors.form}
        </p>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${clubSlug}/batches`)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Creating…" : "Create Batch"}
        </Button>
      </div>

    </form>
  );
}
