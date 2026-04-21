"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  StarRating,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@zenzo/ui";
import { Star } from "lucide-react";

interface Club {
  id: string;
  name: string;
}

interface ExistingRating {
  rating: number;
  reviewText: string | null;
  clubId: string;
}

interface WriteRatingButtonProps {
  coachUserId: string;
  clubs: Club[];
  isSignedIn: boolean;
  existingRating: ExistingRating | null;
}

export function WriteRatingButton({
  coachUserId,
  clubs,
  isSignedIn,
  existingRating,
}: WriteRatingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(existingRating?.rating ?? 0);
  const [text, setText] = React.useState(existingRating?.reviewText ?? "");
  const [clubId, setClubId] = React.useState(
    existingRating?.clubId ?? (clubs.length === 1 ? (clubs[0]?.id ?? "") : "")
  );
  const [status, setStatus] = React.useState<"idle" | "saving" | "deleting">("idle");
  const [error, setError] = React.useState("");

  const isEditing = !!existingRating;
  const MAX = 500;

  function handleOpen() {
    if (!isSignedIn) {
      router.push(`/login?redirect=/coaches/${coachUserId}`);
      return;
    }
    setOpen(true);
  }

  async function handleSubmit() {
    if (rating < 1) { setError("Please select a rating"); return; }
    if (!clubId) { setError("Please select a club"); return; }
    setStatus("saving");
    setError("");

    const res = await fetch(`/api/coaches/${coachUserId}/ratings`, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, reviewText: text.trim() || null, clubId }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      if (res.status === 403) {
        setError("You need to have trained with this coach to leave a rating.");
      } else if (data.error === "already_rated") {
        setError("You've already rated this coach. Refresh to see your rating.");
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
    if (!existingRating?.clubId) return;
    setStatus("deleting");
    await fetch(
      `/api/coaches/${coachUserId}/ratings?clubId=${encodeURIComponent(existingRating.clubId)}`,
      { method: "DELETE" }
    );
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setRating(existingRating?.rating ?? 0);
      setText(existingRating?.reviewText ?? "");
      setClubId(existingRating?.clubId ?? (clubs.length === 1 ? (clubs[0]?.id ?? "") : ""));
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
        {isEditing ? "Edit rating" : "Rate this coach"}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          title={isEditing ? "Edit your rating" : "Rate this coach"}
          description="Share your experience with this coach."
          className="max-w-sm"
        >
          <div className="space-y-5">
            {clubs.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-label text-muted">Club</p>
                <Select value={clubId} onValueChange={setClubId}>
                  <SelectTrigger placeholder="Select club…" />
                  <SelectContent>
                    {clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                placeholder="What made this coach great? (optional)"
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
                disabled={status !== "idle" || rating < 1 || !clubId}
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
