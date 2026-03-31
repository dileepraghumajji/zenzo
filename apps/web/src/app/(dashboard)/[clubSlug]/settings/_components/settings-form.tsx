"use client";

// ─── SettingsForm ─────────────────────────────────────────────────────────────
//
// Business profile editor — name, city, phone, business type.
// Submits via PATCH /api/clubs/[clubSlug]/settings.

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
} from "@zenzo/ui";
import { ClubCategory } from "@zenzo/database/enums";

const CATEGORY_OPTIONS: { value: ClubCategory; label: string }[] = [
  { value: ClubCategory.Gym,         label: "Gym / Fitness" },
  { value: ClubCategory.MartialArts, label: "Martial Arts" },
  { value: ClubCategory.Dance,       label: "Dance" },
  { value: ClubCategory.Yoga,        label: "Yoga" },
  { value: ClubCategory.Other,       label: "Other" },
];

interface ClubProfile {
  name: string;
  city: string | null;
  phone: string | null;
  businessType: ClubCategory;
}

interface SettingsFormProps {
  clubSlug: string;
  profile: ClubProfile;
}

export function SettingsForm({ clubSlug, profile }: SettingsFormProps) {
  const router = useRouter();

  const [name,         setName]         = React.useState(profile.name);
  const [city,         setCity]         = React.useState(profile.city ?? "");
  const [phone,        setPhone]        = React.useState(profile.phone ?? "");
  const [businessType, setBusinessType] = React.useState<ClubCategory>(profile.businessType);

  const [isLoading, setIsLoading] = React.useState(false);
  const [saved,     setSaved]     = React.useState(false);
  const [error,     setError]     = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Club name is required."); return; }

    setIsLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          name.trim(),
          city:          city.trim() || null,
          phone:         phone.trim() || null,
          business_type: businessType,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save changes."); return; }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Club Name" htmlFor="name" required>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Iron Forge Gym"
        />
      </FormField>

      <FormField label="Category" htmlFor="businessType" required>
        <Select
          value={businessType}
          onValueChange={(v) => setBusinessType(v as ClubCategory)}
        >
          <SelectTrigger id="businessType" />
          <SelectContent>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City" htmlFor="city">
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Mumbai"
          />
        </FormField>

        <FormField label="Contact Phone" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            maxLength={10}
          />
        </FormField>
      </div>

      {error && (
        <p className="text-[13px] text-error-foreground">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save Changes"}
        </Button>
        {saved && (
          <p className="text-[13px] text-success-foreground font-medium">
            Saved ✓
          </p>
        )}
      </div>
    </form>
  );
}
