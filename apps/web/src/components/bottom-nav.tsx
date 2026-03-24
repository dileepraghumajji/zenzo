"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  IndianRupee,
  BarChart2,
  MessageSquare,
  Trophy,
  UserCheck,
  Settings,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@zenzo/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BottomNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

// Max 4 primary items — "More" occupies the 5th slot
const ownerPrimaryItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "dashboard" },
  { icon: Users,           label: "Members",    href: "members" },
  { icon: ClipboardCheck,  label: "Attendance", href: "attendance" },
  { icon: IndianRupee,     label: "Payments",   href: "payments" },
];

const ownerMoreItems: BottomNavItem[] = [
  { icon: BarChart2,     label: "Reports",        href: "reports" },
  { icon: CalendarDays,  label: "Batches",        href: "batches" },
  { icon: MessageSquare, label: "Communications", href: "communications" },
  { icon: Trophy,        label: "Progression",    href: "progression" },
  { icon: UserCheck,     label: "Staff",          href: "staff" },
  { icon: Settings,      label: "Settings",       href: "settings" },
];

const staffPrimaryItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "dashboard" },
  { icon: ClipboardCheck,  label: "Attendance", href: "attendance" },
  { icon: Users,           label: "Members",    href: "members" },
  { icon: Trophy,          label: "Progression",href: "progression" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BottomNavProps {
  tenantSlug: string;
  role?: "owner" | "staff";
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

export function BottomNav({ tenantSlug, role = "owner" }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const primaryItems = role === "owner" ? ownerPrimaryItems : staffPrimaryItems;
  const moreItems = role === "owner" ? ownerMoreItems : [];

  const isActive = (href: string) =>
    pathname === `/${tenantSlug}/${href}` ||
    pathname.startsWith(`/${tenantSlug}/${href}/`);

  // Close More sheet on route change
  React.useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Tab bar ── */}
      <nav
        className={cn(
          // Mobile/tablet only
          "flex lg:hidden",
          // Fixed to bottom
          "fixed bottom-0 inset-x-0 z-40",
          // Surface
          "bg-background border-t border-border",
          // Height + safe area (handles iPhone notch)
          "h-14 pb-[env(safe-area-inset-bottom)]"
        )}
        aria-label="Main navigation"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/${tenantSlug}/${item.href}`}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0",
                "transition-colors duration-150",
                active ? "text-brand" : "text-muted"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5 flex-shrink-0" />
              <span className="text-[10px] font-medium leading-none truncate px-1">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button — shown only when there are overflow items */}
        {moreItems.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="More navigation items"
            aria-expanded={moreOpen}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0",
              "transition-colors duration-150",
              moreOpen ? "text-brand" : "text-muted"
            )}
          >
            <MoreHorizontal className="size-5 flex-shrink-0" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        )}
      </nav>

      {/* ── More sheet (inline — replaced by BottomSheet component in Task 16) ── */}
      {moreOpen && (
        <MoreSheet
          tenantSlug={tenantSlug}
          items={moreItems}
          activeCheck={isActive}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </>
  );
}

// ─── MoreSheet ────────────────────────────────────────────────────────────────
// Minimal slide-up sheet. Will be replaced by the BottomSheet component (Task 16).

function MoreSheet({
  tenantSlug,
  items,
  activeCheck,
  onClose,
}: {
  tenantSlug: string;
  items: BottomNavItem[];
  activeCheck: (href: string) => boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50",
          "bg-background rounded-t-xl border-t border-border",
          "pb-[env(safe-area-inset-bottom)]"
        )}
        role="dialog"
        aria-label="More navigation"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-border" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="font-semibold text-heading text-[15px]">More</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Items */}
        <nav className="p-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeCheck(item.href);
            return (
              <Link
                key={item.href}
                href={`/${tenantSlug}/${item.href}`}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg",
                  "transition-colors duration-150",
                  active
                    ? "bg-primary-subtle text-brand"
                    : "text-foreground hover:bg-surface-subtle"
                )}
              >
                <Icon className="size-5 flex-shrink-0" />
                <span className="text-[14px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
