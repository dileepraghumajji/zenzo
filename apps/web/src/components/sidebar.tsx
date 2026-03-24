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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@zenzo/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

const ownerPrimaryNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "dashboard" },
  { icon: Users,           label: "Members",    href: "members" },
  { icon: CalendarDays,    label: "Batches",    href: "batches" },
  { icon: ClipboardCheck,  label: "Attendance", href: "attendance" },
  { icon: IndianRupee,     label: "Payments",   href: "payments" },
  { icon: BarChart2,       label: "Reports",    href: "reports" },
];

const ownerSecondaryNav: NavItem[] = [
  { icon: MessageSquare, label: "Communications", href: "communications" },
  { icon: Trophy,        label: "Progression",    href: "progression" },
  { icon: UserCheck,     label: "Staff",          href: "staff" },
  { icon: Settings,      label: "Settings",       href: "settings" },
];

const staffPrimaryNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "dashboard" },
  { icon: ClipboardCheck,  label: "Attendance", href: "attendance" },
  { icon: Users,           label: "Members",    href: "members" },
  { icon: Trophy,          label: "Progression",href: "progression" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  tenantSlug: string;
  role?: "owner" | "staff";
  userName?: string;
  userInitials?: string;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({
  tenantSlug,
  role = "owner",
  userName = "User",
  userInitials = "U",
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Restore collapse state from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("zenzo-sidebar-collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("zenzo-sidebar-collapsed", String(next));
      return next;
    });
  };

  const primaryNav = role === "owner" ? ownerPrimaryNav : staffPrimaryNav;
  const secondaryNav = role === "owner" ? ownerSecondaryNav : [];

  const isActive = (href: string) =>
    pathname === `/${tenantSlug}/${href}` ||
    pathname.startsWith(`/${tenantSlug}/${href}/`);

  return (
    <aside
      className={cn(
        // Desktop only — mobile uses bottom nav
        "hidden lg:flex flex-col flex-shrink-0",
        // Fill viewport height, scroll internally if nav overflows
        "overflow-y-auto overflow-x-hidden",
        // Surface
        "bg-background border-r border-border",
        // Collapse transition
        "transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          "flex items-center h-16 px-4 flex-shrink-0 border-b border-border",
          isCollapsed ? "justify-center px-0" : "gap-2.5"
        )}
      >
        {/* Brand mark */}
        <div className="size-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-[14px]">Z</span>
        </div>
        {/* Brand name — fades out before width finishes */}
        <span
          className={cn(
            "font-semibold text-heading text-[15px] whitespace-nowrap",
            "transition-opacity duration-[120ms]",
            isCollapsed ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"
          )}
        >
          Zenzo
        </span>
      </div>

      {/* ── Primary nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {primaryNav.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            href={`/${tenantSlug}/${item.href}`}
            active={isActive(item.href)}
            collapsed={isCollapsed}
          />
        ))}

        {/* Divider + secondary nav (owner only) */}
        {secondaryNav.length > 0 && (
          <>
            <div className="my-2 h-px bg-border" aria-hidden="true" />
            {secondaryNav.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                href={`/${tenantSlug}/${item.href}`}
                active={isActive(item.href)}
                collapsed={isCollapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── Bottom: user row + collapse toggle ── */}
      <div className="flex-shrink-0 border-t border-border p-2 space-y-1">
        {/* User */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-md",
            isCollapsed ? "justify-center" : ""
          )}
          title={isCollapsed ? userName : undefined}
        >
          {/* Mini avatar */}
          <div className="size-7 rounded-full bg-primary-subtle flex items-center justify-center flex-shrink-0">
            <span className="text-brand text-[11px] font-semibold leading-none">
              {userInitials}
            </span>
          </div>
          <span
            className={cn(
              "text-[13px] text-foreground font-medium truncate",
              "transition-opacity duration-[120ms]",
              isCollapsed ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"
            )}
          >
            {userName}
          </span>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md",
            "text-muted hover:bg-surface-subtle hover:text-foreground",
            "transition-colors duration-150",
            isCollapsed ? "justify-center" : ""
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4 flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-4 flex-shrink-0" />
              <span
                className={cn(
                  "text-[13px] whitespace-nowrap",
                  "transition-opacity duration-[120ms]",
                  isCollapsed ? "opacity-0" : "opacity-100"
                )}
              >
                Collapse
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── SidebarNavItem ───────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  href,
  active,
  collapsed,
}: {
  item: NavItem;
  href: string;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-2.5 px-2 py-2 rounded-md",
        "text-[14px] font-medium whitespace-nowrap overflow-hidden",
        "transition-colors duration-150",
        collapsed ? "justify-center" : "",
        active
          ? "bg-primary-subtle text-brand"
          : "text-foreground hover:bg-surface-subtle"
      )}
    >
      {/* Active indicator — 3px pill on left edge */}
      {active && (
        <span
          className="absolute left-0 inset-y-[4px] w-[3px] rounded-r-full bg-primary"
          aria-hidden="true"
        />
      )}

      <Icon className="size-5 flex-shrink-0" />

      {/* Label — fades before sidebar width finishes collapsing */}
      <span
        className={cn(
          "transition-opacity duration-[120ms]",
          collapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

// ─── SidebarSkeleton ──────────────────────────────────────────────────────────
// Shown via Suspense while the user role is being fetched server-side.
// Mirrors the Sidebar's exact dimensions so there's no layout shift on hydration.

export function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 w-60 overflow-hidden bg-background border-r border-border">
      {/* Logo row */}
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-border">
        <div className="size-8 rounded-md skeleton-shimmer flex-shrink-0" />
        <div className="h-4 w-16 rounded skeleton-shimmer" />
      </div>

      {/* Primary nav — 6 items */}
      <div className="flex-1 py-3 px-2 space-y-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonNavItem key={i} />
        ))}

        {/* Divider */}
        <div className="my-2 h-px bg-border" />

        {/* Secondary nav — 4 items */}
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonNavItem key={`s${i}`} />
        ))}
      </div>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t border-border p-2 space-y-1">
        {/* User row */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="size-7 rounded-full skeleton-shimmer flex-shrink-0" />
          <div className="h-3 w-24 rounded skeleton-shimmer" />
        </div>
        {/* Collapse toggle row */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="size-4 rounded skeleton-shimmer flex-shrink-0" />
          <div className="h-3 w-14 rounded skeleton-shimmer" />
        </div>
      </div>
    </aside>
  );
}

function SkeletonNavItem() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
      <div className="size-5 rounded skeleton-shimmer flex-shrink-0" />
      <div className="h-3 w-28 rounded skeleton-shimmer" />
    </div>
  );
}
