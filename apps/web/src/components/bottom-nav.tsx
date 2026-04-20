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
  CreditCard,
  UserCheck,
  Settings,
  MoreHorizontal,
  X,
  Building2,
  ChevronRight,
  Plus,
  BarChart3,
} from "lucide-react";
import { cn } from "@zenzo/ui";
import { StaffRole } from "@zenzo/database/enums";
import type { ClubStub } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BottomNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

const ownerPrimaryItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "dashboard" },
  { icon: Users,           label: "Members",    href: "members" },
  { icon: IndianRupee,     label: "Payments",   href: "payments" },
  { icon: ClipboardCheck,  label: "Attendance", href: "attendance" },
];

const ownerMoreItems: BottomNavItem[] = [
  { icon: CalendarDays, label: "Batches",  href: "batches"   },
  { icon: CreditCard,   label: "Plans",    href: "plans"     },
  { icon: BarChart3,    label: "Reports",  href: "reports"   },
  { icon: UserCheck,    label: "Staff",    href: "staff"     },
  { icon: Settings,     label: "Settings", href: "settings"  },
];

const coachPrimaryItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "dashboard" },
  { icon: ClipboardCheck,  label: "Attendance", href: "attendance" },
  { icon: Users,           label: "Members",    href: "members" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BottomNavProps {
  clubSlug: string;
  role?: StaffRole;
  allClubs?: ClubStub[];
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

export function BottomNav({
  clubSlug,
  role = StaffRole.Owner,
  allClubs = [],
}: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const primaryItems = role === StaffRole.Owner ? ownerPrimaryItems : coachPrimaryItems;
  const moreItems = role === StaffRole.Owner ? ownerMoreItems : [];

  const isActive = (href: string) =>
    pathname === `/${clubSlug}/${href}` ||
    pathname.startsWith(`/${clubSlug}/${href}/`);

  React.useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Tab bar ── */}
      <nav
        className={cn(
          "flex lg:hidden",
          "fixed bottom-0 inset-x-0 z-40",
          "bg-background border-t border-border",
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
              href={`/${clubSlug}/${item.href}`}
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

      {moreOpen && (
        <MoreSheet
          clubSlug={clubSlug}
          items={moreItems}
          activeCheck={isActive}
          allClubs={allClubs}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </>
  );
}

// ─── MoreSheet ────────────────────────────────────────────────────────────────

function MoreSheet({
  clubSlug,
  items,
  activeCheck,
  allClubs,
  onClose,
}: {
  clubSlug: string;
  items: BottomNavItem[];
  activeCheck: (href: string) => boolean;
  allClubs: ClubStub[];
  onClose: () => void;
}) {
  const otherClubs = allClubs.filter((c) => c.slug !== clubSlug);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
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

        {/* Nav items */}
        <nav className="p-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeCheck(item.href);
            return (
              <Link
                key={item.href}
                href={`/${clubSlug}/${item.href}`}
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

        {/* Club switcher section */}
        {allClubs.length > 1 && (
          <div className="border-t border-border px-2 py-2">
            <p className="px-3 py-1 text-[11px] text-muted uppercase tracking-wider font-medium">
              Switch Club
            </p>
            {otherClubs.map((club) => (
              <Link
                key={club.slug}
                href={`/${club.slug}/dashboard`}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-surface-subtle transition-colors"
              >
                <div className="size-7 rounded-md bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
                  <Building2 className="size-4 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate">{club.name}</p>
                  <p className="text-[11px] text-muted capitalize">{club.role}</p>
                </div>
                <ChevronRight className="size-4 text-muted flex-shrink-0" />
              </Link>
            ))}
            <Link
              href="/onboarding/new-club"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-subtle transition-colors"
            >
              <div className="size-7 rounded-md border border-dashed border-border flex items-center justify-center flex-shrink-0">
                <Plus className="size-4" />
              </div>
              <span className="text-[14px]">Create new club</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
