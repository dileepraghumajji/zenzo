"use client";

// ─── DropdownMenu ──────────────────────────────────────────────────────────────
//
// Zenzo-styled wrapper around @radix-ui/react-dropdown-menu.
//
// Design rules:
//   - radius-lg (12px) — same as modal for floating surfaces
//   - shadow-md — just enough lift, not floating
//   - Items: 32px height, 13px body-sm text
//   - Destructive item: text-destructive (flame red)
//   - Separator: thin border-border divider
//   - Checkmark / radio indicator: forge primary
//
// Usage:
//   <DropdownMenu>
//     <DropdownMenuTrigger asChild>
//       <IconButton><MoreVertical/></IconButton>
//     </DropdownMenuTrigger>
//     <DropdownMenuContent align="end">
//       <DropdownMenuItem onSelect={() => router.push(...)}>View Profile</DropdownMenuItem>
//       <DropdownMenuSeparator />
//       <DropdownMenuItem variant="destructive" onSelect={handleDelete}>Delete</DropdownMenuItem>
//     </DropdownMenuContent>
//   </DropdownMenu>

import * as React from "react";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "../lib/cn";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const DropdownMenu          = RadixDropdown.Root;
export const DropdownMenuTrigger   = RadixDropdown.Trigger;
export const DropdownMenuGroup     = RadixDropdown.Group;
export const DropdownMenuPortal    = RadixDropdown.Portal;
export const DropdownMenuSub       = RadixDropdown.Sub;
export const DropdownMenuRadioGroup = RadixDropdown.RadioGroup;

// ─── Content ──────────────────────────────────────────────────────────────────

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <RadixDropdown.Portal>
    <RadixDropdown.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Layout
        "z-50 min-w-[180px] overflow-hidden",
        // Surface
        "bg-background border border-border rounded-lg shadow-md",
        // Padding
        "p-1",
        // Animation
        "data-[state=open]:animate-in  data-[state=open]:fade-in-0  data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "duration-150",
        className
      )}
      {...props}
    />
  </RadixDropdown.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

// ─── Item ─────────────────────────────────────────────────────────────────────

interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> {
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Item>,
  DropdownMenuItemProps
>(({ className, variant = "default", icon, children, ...props }, ref) => (
  <RadixDropdown.Item
    ref={ref}
    className={cn(
      // Layout
      "relative flex items-center gap-2 rounded-md",
      "h-8 px-3",
      // Typography
      "text-[13px] font-normal leading-none",
      "select-none outline-none cursor-pointer",
      // States
      "transition-colors duration-100",
      // Default
      variant === "default" && "text-foreground data-[highlighted]:bg-surface-subtle",
      // Destructive
      variant === "destructive" && "text-destructive data-[highlighted]:bg-error",
      // Disabled
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {icon && (
      <span className="shrink-0 [&_svg]:size-3.5 text-muted" aria-hidden>
        {icon}
      </span>
    )}
    {children}
  </RadixDropdown.Item>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

// ─── Separator ────────────────────────────────────────────────────────────────

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Separator>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Separator
    ref={ref}
    className={cn("my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// ─── Label ────────────────────────────────────────────────────────────────────

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Label>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Label>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.05em] text-muted",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// ─── CheckboxItem ─────────────────────────────────────────────────────────────

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <RadixDropdown.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "relative flex items-center gap-2 rounded-md h-8 pl-8 pr-3",
      "text-[13px] text-foreground select-none outline-none cursor-pointer",
      "transition-colors duration-100",
      "data-[highlighted]:bg-surface-subtle",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <RadixDropdown.ItemIndicator>
        <Check className="size-3.5 text-primary" />
      </RadixDropdown.ItemIndicator>
    </span>
    {children}
  </RadixDropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

// ─── RadioItem ────────────────────────────────────────────────────────────────

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.RadioItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.RadioItem>
>(({ className, children, ...props }, ref) => (
  <RadixDropdown.RadioItem
    ref={ref}
    className={cn(
      "relative flex items-center gap-2 rounded-md h-8 pl-8 pr-3",
      "text-[13px] text-foreground select-none outline-none cursor-pointer",
      "transition-colors duration-100",
      "data-[highlighted]:bg-surface-subtle",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <RadixDropdown.ItemIndicator>
        <Circle className="size-2 fill-primary text-primary" />
      </RadixDropdown.ItemIndicator>
    </span>
    {children}
  </RadixDropdown.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

// ─── SubTrigger ───────────────────────────────────────────────────────────────

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <RadixDropdown.SubTrigger
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-2 rounded-md h-8 px-3",
      "text-[13px] text-foreground select-none outline-none cursor-pointer",
      "transition-colors duration-100",
      "data-[state=open]:bg-surface-subtle data-[highlighted]:bg-surface-subtle",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="size-3.5 text-muted" />
  </RadixDropdown.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

// ─── SubContent ───────────────────────────────────────────────────────────────

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.SubContent>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.SubContent>
>(({ className, ...props }, ref) => (
  <RadixDropdown.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[160px] overflow-hidden p-1",
      "bg-background border border-border rounded-lg shadow-md",
      "data-[state=open]:animate-in  data-[state=open]:fade-in-0  data-[state=open]:zoom-in-95",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "duration-150",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";
