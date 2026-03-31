"use client";

// ─── Checkbox ─────────────────────────────────────────────────────────────────
// Radix UI Checkbox with Zenzo design tokens.
// Usage:
//   <Checkbox checked={isChecked} onCheckedChange={setIsChecked} id="terms" />

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";

export interface CheckboxProps extends
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, id, ...props }, ref) => {
  const inputId = id ?? React.useId();

  return (
    <div className="flex items-center gap-2">
      <CheckboxPrimitive.Root
        ref={ref}
        id={inputId}
        className={cn(
          "peer size-4 shrink-0 rounded border border-border bg-background",
          "ring-offset-background transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="size-3" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] text-foreground select-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox";
