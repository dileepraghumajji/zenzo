"use client";

// ─── Switch ───────────────────────────────────────────────────────────────────
// Radix UI Switch with Zenzo design tokens.
// Usage:
//   <Switch checked={enabled} onCheckedChange={setEnabled} id="notifications" />
//   <Switch label="Enable notifications" checked={enabled} onCheckedChange={setEnabled} />

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../lib/cn";

export interface SwitchProps extends
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const inputId = id ?? React.useId();

  const control = (
    <SwitchPrimitive.Root
      ref={ref}
      id={inputId}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-150 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "bg-border data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm",
          "ring-0 transition-transform duration-150 ease-in-out",
          "translate-x-0 data-[state=checked]:translate-x-4"
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (!label) return control;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <label
          htmlFor={inputId}
          className="text-[14px] font-medium text-foreground cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
        {description && (
          <p className="text-[12px] text-muted">{description}</p>
        )}
      </div>
      {control}
    </div>
  );
});

Switch.displayName = "Switch";
