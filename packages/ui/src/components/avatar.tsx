import * as React from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

// ─── Deterministic pastel palette ────────────────────────────────────────────
//
// 8 warm pastels derived from name hash.
// Same person always gets the same colour — feels personal, not random.
// Full class strings (not dynamic) so Tailwind JIT includes them.

const PALETTE = [
  { bg: "bg-rose-100",   text: "text-rose-700"   },
  { bg: "bg-amber-100",  text: "text-amber-700"  },
  { bg: "bg-lime-100",   text: "text-lime-700"   },
  { bg: "bg-cyan-100",   text: "text-cyan-700"   },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-pink-100",   text: "text-pink-700"   },
  { bg: "bg-teal-100",   text: "text-teal-700"   },
  { bg: "bg-orange-100", text: "text-orange-700" },
] as const;

// djb2 hash — fast, consistent, no dependencies
function hashName(name: string): number {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? "";
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

// ─── Size maps ────────────────────────────────────────────────────────────────

const containerSizes = {
  sm: "size-7  text-[11px]", // 28px
  md: "size-9  text-[13px]", // 36px
  lg: "size-12 text-[16px]", // 48px
  xl: "size-16 text-[20px]", // 64px
};

const onlineDotSizes = {
  sm: "size-1.5 ring-1",
  md: "size-2   ring-1",
  lg: "size-2.5 ring-[1.5px]",
  xl: "size-3   ring-2",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ name, src, size = "md", online, className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showInitials = !src || imgError;

  const palette = PALETTE[hashName(name) % PALETTE.length]!;
  const initials = getInitials(name);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        "rounded-full overflow-hidden select-none",
        containerSizes[size],
        showInitials && cn(palette.bg, palette.text),
        "font-medium leading-none",
        className
      )}
      aria-label={name}
      role="img"
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          className="size-full object-cover object-center"
          onError={() => setImgError(true)}
          // Serve at 2× for retina — consumer is responsible for the URL
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}

      {/* Online indicator dot */}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0",
            "rounded-full ring-white",
            onlineDotSizes[size],
            online ? "bg-jade-500" : "bg-stone-300"
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </span>
  );
}

Avatar.displayName = "Avatar";
