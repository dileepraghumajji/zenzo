"use client";

// ─── Dialog ────────────────────────────────────────────────────────────────────
//
// Zenzo-styled wrapper around @radix-ui/react-dialog.
//
// Design rules (from DESIGN_CONSTITUTION.md + DESIGN_MANIFESTO_V2.md):
//   - radius-lg (12px) — modals float above the page
//   - Overlay: var(--overlay-bg) — warm stone-900 at 50% opacity
//   - No shadow on modal itself (flat precision, overlay creates depth)
//   - ONE forge-600 primary action inside — consumer is responsible
//   - Enter: fade + scale (200ms). Exit: fade (150ms).
//   - Title: h2 size (20px/600). Description: body/muted.
//
// Usage:
//   <Dialog>
//     <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
//     <DialogContent title="Confirm delete">
//       <p>Are you sure?</p>
//       <DialogFooter>
//         <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
//         <Button variant="danger" onClick={handleDelete}>Delete</Button>
//       </DialogFooter>
//     </DialogContent>
//   </Dialog>

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

// ─── Re-exports (pass-through) ────────────────────────────────────────────────

export const Dialog        = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose   = RadixDialog.Close;
export const DialogPortal  = RadixDialog.Portal;

// ─── Overlay ──────────────────────────────────────────────────────────────────

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RadixDialog.Overlay
    ref={ref}
    className={cn(
      // Base
      "fixed inset-0 z-[60]",
      // Backdrop — warm stone overlay
      "bg-[var(--overlay-bg)]",
      // Animation
      "data-[state=open]:animate-in  data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

// ─── Content ──────────────────────────────────────────────────────────────────

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  title: string;
  description?: string;
  /** Hide the built-in close (X) button — for controlled flows. */
  hideClose?: boolean;
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  DialogContentProps
>(({ className, title, description, hideClose = false, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        // Position
        "fixed left-1/2 top-1/2 z-[70]",
        "-translate-x-1/2 -translate-y-1/2",
        // Size — max 480px, full-width on mobile with margin
        "w-[calc(100%-32px)] max-w-[480px]",
        // Surface — flat precision, no shadow
        "bg-background border border-border rounded-lg",
        // Padding
        "p-6",
        // Remove default focus outline (we handle it ourselves)
        "focus:outline-none",
        // Animations
        "data-[state=open]:animate-in  data-[state=open]:fade-in-0  data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "duration-200",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <RadixDialog.Title className="text-[20px] font-semibold text-heading leading-tight">
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="mt-1 text-[14px] text-muted leading-snug">
              {description}
            </RadixDialog.Description>
          )}
        </div>

        {!hideClose && (
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
        )}
      </div>

      {children}
    </RadixDialog.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

// ─── Footer ───────────────────────────────────────────────────────────────────
// Right-aligned button row. On mobile, stacks vertically (primary action on top).

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2",
        "sm:flex-row sm:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}
