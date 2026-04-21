"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  StarRating,
} from "@zenzo/ui";
import { Star } from "lucide-react";

interface ExistingReview {
  id: string;
  rating: number;
  reviewText: string | null;
}

interface WriteReviewButtonProps {
  clubSlug: string;
  isSignedIn: boolean;
  existingReview: ExistingReview | null;
}

export function WriteReviewButton({
  clubSlug,
  isSignedIn,
  existingReview,
}: WriteReviewButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(existingReview?.rating ?? 0);
  const [text, setText] = React.useState(existingReview?.reviewText ?? "");
  const [status, setStatus] = React.useState<"idle" | "saving" | "deleting">("idle");
  const [error, setError] = React.useState("");

  const isEditing = !!existingReview;
  const MAX = 500;

  function handleOpen() {
    if (!isSignedIn) {
      router.push(`/login?redirect=/clubs/${clubSlug}`);
      return;
    }
    setOpen(true);
  }

  async function handleSubmit() {
    if (rating < 1) {
      setError("Please select a rating");
      return;
    }
    setStatus("saving");
    setError("");

    const res = await fetch(`/api/clubs/${clubSlug}/reviews`, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, reviewText: text.trim() || null }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      if (res.status === 403) {
        setError("You need to be a member of this club to leave a review.");
      } else if (data.error === "already_reviewed") {
        setError("You've already reviewed this club. Refresh to see your review.");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
      setStatus("idle");
      return;
    }

    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  async function handleDelete() {
    setStatus("deleting");
    await fetch(`/api/clubs/${clubSlug}/reviews`, { method: "DELETE" });
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset to persisted state on close
      setRating(existingReview?.rating ?? 0);
      setText(existingReview?.reviewText ?? "");
      setError("");
      setStatus("idle");
    }
    setOpen(next);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-caption font-medium text-muted hover:text-heading hover:border-brand/40 transition-colors"
      >
        <Star className="size-3.5" />
        {isEditing ? "Edit review" : "Write a Review"}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          title={isEditing ? "Edit your review" : "Write a review"}
          description="Share your experience at this club."
          className="max-w-sm"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-label text-muted">Your rating</p>
              <StarRating
                value={rating}
                interactive
                onChange={setRating}
                size="lg"
              />
            </div>

            <div className="space-y-1.5">
              <textarea
                className="w-full rounded-lg border border-border bg-surface-subtle px-3 py-2.5 text-body text-heading placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-brand/50 transition-colors"
                placeholder="What did you like? What could be better? (optional)"
                rows={4}
                maxLength={MAX}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-caption text-muted text-right">
                {text.length}/{MAX}
              </p>
            </div>

            {error && (
              <p className="text-caption text-error-foreground">{error}</p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            {isEditing && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={status !== "idle"}
              >
                {status === "deleting" ? "Deleting…" : "Delete"}
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={status !== "idle"}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={status !== "idle" || rating < 1}
                loading={status === "saving"}
              >
                {isEditing ? "Update" : "Submit"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
