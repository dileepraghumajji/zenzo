"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface StarRatingProps {
  value: number;
  max?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

function StarIcon({
  fill,
  sizeClass,
}: {
  fill: "full" | "half" | "empty";
  sizeClass: string;
}) {
  if (fill === "full") {
    return (
      <span className={cn("leading-none select-none text-yellow-400", sizeClass)}>
        ★
      </span>
    );
  }
  if (fill === "empty") {
    return (
      <span className={cn("leading-none select-none text-foreground/20", sizeClass)}>
        ★
      </span>
    );
  }
  return (
    <span className="relative inline-flex leading-none select-none">
      <span className={cn("text-foreground/20", sizeClass)}>★</span>
      <span
        className={cn("absolute inset-0 overflow-hidden text-yellow-400", sizeClass)}
        style={{ width: "50%" }}
        aria-hidden
      >
        ★
      </span>
    </span>
  );
}

export function StarRating({
  value,
  max = 5,
  interactive = false,
  onChange,
  size = "md",
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const display = hovered !== null && interactive ? hovered : value;
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  function getFill(starNum: number): "full" | "half" | "empty" {
    if (display >= starNum) return "full";
    if (display >= starNum - 0.5) return "half";
    return "empty";
  }

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starNum = i + 1;
        if (!interactive) {
          return <StarIcon key={i} fill={getFill(starNum)} sizeClass={sizeClass} />;
        }
        return (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${starNum} star${starNum > 1 ? "s" : ""}`}
            className="focus-visible:outline-none transition-transform hover:scale-110 cursor-pointer"
            onClick={() => onChange?.(starNum)}
            onMouseEnter={() => setHovered(starNum)}
            onMouseLeave={() => setHovered(null)}
          >
            <StarIcon fill={getFill(starNum)} sizeClass={sizeClass} />
          </button>
        );
      })}
    </div>
  );
}
