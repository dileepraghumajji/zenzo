"use client";

// ─── Select ────────────────────────────────────────────────────────────────────
//
// Zenzo-styled wrapper around @radix-ui/react-select.
//
// Design rules:
//   - Trigger looks and feels identical to Input (same height, border, radius)
//   - Dropdown: radius-lg, shadow-md, same surface as DropdownMenu
//   - Checkmark on selected item (forge primary)
//   - Placeholder: muted text (stone-400), same as input placeholder
//   - Error state: same as Input (flame-500 border + ring)
//
// Usage:
//   <Select value={value} onValueChange={setValue}>
//     <SelectTrigger placeholder="Select batch..." error={!!errors.batch} />
//     <SelectContent>
//       <SelectItem value="morning">Morning Batch</SelectItem>
//       <SelectItem value="evening">Evening Batch</SelectItem>
//     </SelectContent>
//   </Select>

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/cn";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const Select        = RadixSelect.Root;
export const SelectGroup   = RadixSelect.Group;
export const SelectValue   = RadixSelect.Value;

// ─── Trigger ──────────────────────────────────────────────────────────────────

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger> {
  placeholder?: string;
  error?: boolean;
}

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  SelectTriggerProps
>(({ className, placeholder, error = false, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(
      // Matches Input sizing exactly
      "flex w-full items-center justify-between",
      "h-12 md:h-10 px-3 rounded-md",
      // Typography
      "text-[14px] text-foreground",
      // Border
      "border transition-colors duration-150",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
      "disabled:bg-surface-subtle disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50",
      // State
      error
        ? "border-error-accent focus-visible:ring-error-accent"
        : "border-border hover:border-border-strong focus-visible:ring-ring focus-visible:border-border-strong",
      className
    )}
    {...props}
  >
    <RadixSelect.Value
      placeholder={
        <span className="text-placeholder">{placeholder ?? "Select…"}</span>
      }
    >
      {children}
    </RadixSelect.Value>
    <RadixSelect.Icon asChild>
      <ChevronDown className="size-4 text-muted shrink-0 ml-2" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

// ─── Content ──────────────────────────────────────────────────────────────────

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      position={position}
      sideOffset={4}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden",
        "bg-background border border-border rounded-lg shadow-md",
        // Animate
        "data-[state=open]:animate-in  data-[state=open]:fade-in-0  data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "duration-150",
        // Popper: match trigger width
        position === "popper" &&
          "w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)]",
        className
      )}
      {...props}
    >
      {/* Scroll up button */}
      <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1 text-muted">
        <ChevronUp className="size-4" />
      </RadixSelect.ScrollUpButton>

      <RadixSelect.Viewport className="p-1">
        {children}
      </RadixSelect.Viewport>

      {/* Scroll down button */}
      <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1 text-muted">
        <ChevronDown className="size-4" />
      </RadixSelect.ScrollDownButton>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = "SelectContent";

// ─── Item ─────────────────────────────────────────────────────────────────────

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      "relative flex items-center rounded-md",
      "h-9 pl-8 pr-3",
      "text-[13px] text-foreground",
      "select-none outline-none cursor-pointer",
      "transition-colors duration-100",
      "data-[highlighted]:bg-surface-subtle",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {/* Selected checkmark */}
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <RadixSelect.ItemIndicator>
        <Check className="size-3.5 text-primary" />
      </RadixSelect.ItemIndicator>
    </span>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = "SelectItem";

// ─── Separator ────────────────────────────────────────────────────────────────

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(({ className, ...props }, ref) => (
  <RadixSelect.Separator
    ref={ref}
    className={cn("my-1 h-px bg-border", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

// ─── Label ────────────────────────────────────────────────────────────────────

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(({ className, ...props }, ref) => (
  <RadixSelect.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.05em] text-muted",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";
