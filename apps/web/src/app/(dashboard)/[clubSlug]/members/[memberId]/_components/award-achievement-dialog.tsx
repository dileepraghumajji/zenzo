"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
  FormField,
} from "@zenzo/ui";
import { ACHIEVEMENT_TEMPLATES } from "@zenzo/database/enums";

interface AwardAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
  membershipId: string;
  memberName: string;
  onSuccess: () => void;
}

type Template = (typeof ACHIEVEMENT_TEMPLATES)[number];

export function AwardAchievementDialog({
  open,
  onOpenChange,
  clubSlug,
  membershipId,
  memberName,
  onSuccess,
}: AwardAchievementDialogProps) {
  const [selected, setSelected] = React.useState<Template | null>(null);
  const [customTitle, setCustomTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [awardedAt, setAwardedAt] = React.useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isCustom = selected?.slug === "custom";
  const effectiveTitle = isCustom ? customTitle.trim() : selected?.title ?? "";
  const canSubmit = effectiveTitle.length > 0 && !isSubmitting;

  const reset = () => {
    setSelected(null);
    setCustomTitle("");
    setDescription("");
    setAwardedAt(new Date().toISOString().slice(0, 10));
    setError(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/clubs/${clubSlug}/members/${membershipId}/achievements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: effectiveTitle,
            description: description.trim() || undefined,
            badgeIcon: isCustom ? "🎯" : selected?.icon,
            awardedAt,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to award achievement");
      }

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title={`Award Badge to ${memberName}`}>
        <div className="space-y-5 py-1">

          {/* Template grid */}
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-muted mb-2">
              Choose a badge
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ACHIEVEMENT_TEMPLATES.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => {
                    setSelected(t);
                    if (t.slug !== "custom") setDescription(t.description);
                  }}
                  className={[
                    "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors",
                    selected?.slug === t.slug
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-surface-subtle hover:border-border/60 hover:bg-surface-raised",
                  ].join(" ")}
                >
                  <span className="text-[22px] leading-none">{t.icon}</span>
                  <span className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">
                    {t.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom title (only for custom badge) */}
          {isCustom && (
            <FormField label="Badge title">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Black Belt, Coach's Pick…"
                maxLength={80}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </FormField>
          )}

          {/* Description */}
          <FormField label="Note (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a personal note…"
              rows={2}
              maxLength={200}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </FormField>

          {/* Date */}
          <FormField label="Date awarded">
            <input
              type="date"
              value={awardedAt}
              onChange={(e) => setAwardedAt(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </FormField>

          {error && (
            <p className="text-[13px] text-error-foreground">{error}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Awarding…" : "Award Badge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
