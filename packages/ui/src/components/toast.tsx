"use client";

// ─── Toast + Toaster ───────────────────────────────────────────────────────────
//
// Zenzo-styled wrapper around @radix-ui/react-toast.
//
// Design rules (from DESIGN_MANIFESTO_V2.md "The Ledger Voice"):
//   - Success: "Saved." Full stop. Never "Great! Your changes have been saved!"
//   - Error:   "Couldn't save. [Retry]" — points forward, no apologies
//   - Position: bottom-right desktop, bottom-center mobile
//   - No dismiss X on success toasts (they auto-dismiss in 3s)
//   - Dismiss X on error toasts (user may need to read it)
//   - Surface: surface-raised (card), border by status colour for signal
//
// Usage:
//   // In root layout: <Toaster />
//
//   // In any client component:
//   import { useToast } from "@zenzo/ui";
//   const { toast } = useToast();
//   toast.success("Saved.");
//   toast.error("Couldn't save. Check your connection.");
//   toast.info("Reminder sent.");

import * as React from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "../lib/cn";

// ─── Toast context + hook ─────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: {
    success: (title: string) => void;
    error:   (title: string, action?: ToastItem["action"]) => void;
    info:    (title: string) => void;
  };
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster />");
  return ctx;
}

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ElementType; border: string; iconClass: string; autoDismiss: boolean }
> = {
  success: {
    icon: CheckCircle,
    border: "border-l-4 border-l-success-accent",
    iconClass: "text-success-accent",
    autoDismiss: true,
  },
  error: {
    icon: AlertCircle,
    border: "border-l-4 border-l-error-accent",
    iconClass: "text-error-accent",
    autoDismiss: false,
  },
  info: {
    icon: Info,
    border: "border-l-4 border-l-info-accent",
    iconClass: "text-info-accent",
    autoDismiss: true,
  },
};

// ─── Toaster ──────────────────────────────────────────────────────────────────
// Drop into root layout once. Provides <ToastContext> to the whole tree.

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback(
    (variant: ToastVariant, title: string, action?: ToastItem["action"]) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, variant, title, action }]);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({
      toast: {
        success: (title)          => addToast("success", title),
        error:   (title, action)  => addToast("error", title, action),
        info:    (title)          => addToast("info", title),
      },
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((t) => {
          const cfg = VARIANT_CONFIG[t.variant];
          const Icon = cfg.icon;
          const duration = cfg.autoDismiss ? 3000 : Infinity;

          return (
            <RadixToast.Root
              key={t.id}
              duration={duration}
              onOpenChange={(open: boolean) => { if (!open) removeToast(t.id); }}
              className={cn(
                // Layout
                "flex items-start gap-3 p-4",
                // Surface
                "bg-surface-raised border border-border rounded-lg shadow-lg",
                // Status colour on left edge
                cfg.border,
                // Width
                "w-[340px] max-w-[calc(100vw-32px)]",
                // Animation
                "data-[state=open]:animate-in  data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=closed]:fade-out-0",
                "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
                "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
                "duration-200"
              )}
            >
              {/* Status icon */}
              <Icon className={cn("size-4 mt-0.5 shrink-0", cfg.iconClass)} aria-hidden />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <RadixToast.Title className="text-[13px] font-medium text-foreground leading-snug">
                  {t.title}
                </RadixToast.Title>
                {t.action && (
                  <RadixToast.Action
                    altText={t.action.label}
                    asChild
                  >
                    <button
                      onClick={t.action.onClick}
                      className="mt-1 text-[12px] font-medium text-brand hover:underline"
                    >
                      {t.action.label}
                    </button>
                  </RadixToast.Action>
                )}
              </div>

              {/* Dismiss — always on error, never on success */}
              {!cfg.autoDismiss && (
                <RadixToast.Close
                  aria-label="Dismiss"
                  className="shrink-0 text-muted hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </RadixToast.Close>
              )}
            </RadixToast.Root>
          );
        })}

        {/* Viewport — bottom-right on desktop, bottom-center on mobile */}
        <RadixToast.Viewport
          className={cn(
            "fixed z-[80] flex flex-col gap-2",
            // Mobile: bottom-center
            "bottom-4 left-1/2 -translate-x-1/2",
            // Desktop: bottom-right, no translate
            "lg:left-auto lg:right-4 lg:translate-x-0",
            // Prevent interaction with elements below
            "pointer-events-none [&>*]:pointer-events-auto"
          )}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
