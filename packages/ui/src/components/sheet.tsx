"use client";

// ─── Sheet ─────────────────────────────────────────────────────────────────────
//
// Bottom sheet built on top of @radix-ui/react-dialog.
// Mobile-first: slides up from the bottom edge.
// On desktop: becomes a side panel (right side).
//
// Design rules (from DESIGN_CONSTITUTION.md):
//   - radius-xl (16px) on top corners only — slides from the edge
//   - Same warm overlay as Dialog
//   - Drag handle indicator at the top (decorative)
//   - Max-height: 85vh — never full screen (context should be visible)
//   - Desktop: right-side panel, max-w 400px, full height
//
// Usage:
//   <Sheet>
//     <SheetTrigger asChild><Button>More actions</Button></SheetTrigger>
//     <SheetContent title="Actions">
//       <p>Content here</p>
//     </SheetContent>
//   </Sheet>

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const Sheet        = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose   = RadixDialog.Close;
export const SheetPortal  = RadixDialog.Portal;

// ─── Overlay ──────────────────────────────────────────────────────────────────

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RadixDialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[60] bg-[var(--overlay-bg)]",
      "data-[state=open]:animate-in  data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      "duration-200",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

// ─── Content ──────────────────────────────────────────────────────────────────

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  title: string;
  description?: string;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  SheetContentProps
>(({ className, title, description, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        // Mobile: slide up from bottom
        "fixed inset-x-0 bottom-0 z-[70]",
        "flex flex-col",
        "max-h-[85vh]",
        // Rounded top corners only
        "rounded-t-xl",
        // Surface
        "bg-background border-t border-border",
        // Safe area on iOS
        "pb-[env(safe-area-inset-bottom,0px)]",
        // Remove focus outline
        "focus:outline-none",
        // Mobile slide animation
        "data-[state=open]:animate-in  data-[state=open]:slide-in-from-bottom-full",
        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full",
        // Desktop: right panel
        "lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:w-[400px]",
        "lg:rounded-none lg:border-t-0 lg:border-l",
        "lg:data-[state=open]:slide-in-from-right-full",
        "lg:data-[state=closed]:slide-out-to-right-full",
        "duration-300",
        className
      )}
      {...props}
    >
      {/* Drag handle (mobile only) */}
      <div className="flex justify-center pt-3 pb-1 lg:hidden" aria-hidden>
        <div className="w-10 h-1 rounded-full bg-border" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
        <div className="flex-1 min-w-0">
          <RadixDialog.Title className="text-[18px] font-semibold text-heading leading-tight">
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="mt-1 text-[13px] text-muted">
              {description}
            </RadixDialog.Description>
          )}
        </div>
        <RadixDialog.Close
          className={cn(
            "shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
            "text-muted hover:text-foreground hover:bg-surface-subtle",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label="Close"
        >
          <X className="size-4" />
        </RadixDialog.Close>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {children}
      </div>
    </RadixDialog.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

// ─── Footer ───────────────────────────────────────────────────────────────────

export function SheetFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-col-reverse gap-2 px-6 py-4",
        "border-t border-border",
        "sm:flex-row sm:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}
