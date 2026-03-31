"use client";

// ─── LogoUpload ───────────────────────────────────────────────────────────────
// Uploads logo to Supabase Storage bucket "club-logos" via the browser client,
// then PATCHes /api/clubs/[clubSlug]/settings with the public URL.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Button, cn } from "@zenzo/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LogoUploadProps {
  clubSlug:       string;
  currentLogoUrl: string | null;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const BUCKET        = "club-logos";

export function LogoUpload({ clubSlug, currentLogoUrl }: LogoUploadProps) {
  const router  = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [preview,   setPreview]   = React.useState<string | null>(currentLogoUrl);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error,     setError]     = React.useState("");
  const [saved,     setSaved]     = React.useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be under 2 MB.");
      return;
    }

    setError("");
    setIsLoading(true);
    setSaved(false);

    try {
      const supabase = createSupabaseBrowserClient();
      const ext      = file.name.split(".").pop() ?? "png";
      const path     = `${clubSlug}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) { setError(uploadError.message); return; }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      // Save URL to club record
      const res = await fetch(`/api/clubs/${clubSlug}/settings`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ logo_url: publicUrl }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save logo URL.");
        return;
      }

      setPreview(publicUrl);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/settings`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ logo_url: null }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to remove logo."); return; }
      setPreview(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className={cn(
          "size-20 rounded-xl border-2 border-border bg-surface-subtle",
          "flex items-center justify-center overflow-hidden shrink-0"
        )}>
          {preview
            ? <img src={preview} alt="Club logo" className="w-full h-full object-cover" />
            : <Upload className="size-7 text-muted" />
          }
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
          >
            {isLoading ? "Uploading…" : preview ? "Replace Logo" : "Upload Logo"}
          </Button>
          {preview && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="size-3.5" />}
              disabled={isLoading}
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
          <p className="text-[12px] text-muted">PNG, JPG or WebP · max 2 MB</p>
        </div>
      </div>

      {error && <p className="text-[13px] text-error-foreground">{error}</p>}
      {saved && <p className="text-[13px] text-success-foreground font-medium">Logo saved ✓</p>}
    </div>
  );
}
