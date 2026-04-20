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
  UserCheck,
  Settings,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  ChevronDown,
  Check,
  Plus,
  BarChart3,
} from "lucide-react";
import { cn } from "@zenzo/ui";
import { StaffRole } from "@zenzo/database/enums";
import type { ClubStub } from "@/lib/auth";

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
  { icon: CreditCard,      label: "Plans",      href: "plans"    },
];

const ownerSecondaryNav: NavItem[] = [
  { icon: BarChart3,  label: "Reports",  href: "reports"   },
  { icon: UserCheck,  label: "Staff",    href: "staff"     },
  { icon: Settings,   label: "Settings", href: "settings"  },
];

const coachPrimaryNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "dashboard" },
  { icon: ClipboardCheck,  label: "Attendance", href: "attendance" },
  { icon: Users,           label: "Members",    href: "members" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  clubSlug: string;
  role?: StaffRole;
  userName?: string;
  userInitials?: string;
  allClubs?: ClubStub[];
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({
  clubSlug,
  role = StaffRole.Owner,
  userName = "User",
  userInitials = "U",
  allClubs = [],
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const switcherRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("zenzo-sidebar-collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  // Close switcher on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    if (switcherOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [switcherOpen]);

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("zenzo-sidebar-collapsed", String(next));
      return next;
    });
  };

  const primaryNav = role === StaffRole.Owner ? ownerPrimaryNav : coachPrimaryNav;
  const secondaryNav = role === StaffRole.Owner ? ownerSecondaryNav : [];

  const isActive = (href: string) =>
    pathname === `/${clubSlug}/${href}` ||
    pathname.startsWith(`/${clubSlug}/${href}/`);

  const currentClub = allClubs.find((c) => c.slug === clubSlug);
  const otherClubs = allClubs.filter((c) => c.slug !== clubSlug);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col flex-shrink-0",
        "overflow-y-auto overflow-x-hidden",
        "bg-background border-r border-border",
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
        <div className="size-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-[14px]">Z</span>
        </div>
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
            href={`/${clubSlug}/${item.href}`}
            active={isActive(item.href)}
            collapsed={isCollapsed}
          />
        ))}

        {secondaryNav.length > 0 && (
          <>
            <div className="my-2 h-px bg-border" aria-hidden="true" />
            {secondaryNav.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                href={`/${clubSlug}/${item.href}`}
                active={isActive(item.href)}
                collapsed={isCollapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── Bottom: club switcher + user row + collapse toggle ── */}
      <div className="flex-shrink-0 border-t border-border p-2 space-y-1">

        {/* Club switcher */}
        {allClubs.length > 0 && (
          <div ref={switcherRef} className="relative">
            <button
              onClick={() => {
                if (!isCollapsed) setSwitcherOpen((o) => !o);
              }}
              title={isCollapsed ? (currentClub?.name ?? clubSlug) : undefined}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
                "hover:bg-surface-subtle transition-colors duration-150",
                isCollapsed ? "justify-center" : "justify-between"
              )}
            >
              <div className={cn("flex items-center gap-2 min-w-0", isCollapsed && "justify-center")}>
                <div className="size-5 rounded flex items-center justify-center bg-primary-subtle flex-shrink-0">
                  <Building2 className="size-3 text-brand" />
                </div>
                <span
                  className={cn(
                    "text-[13px] text-foreground font-medium truncate",
                    "transition-opacity duration-[120ms]",
                    isCollapsed ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"
                  )}
                >
                  {currentClub?.name ?? clubSlug}
                </span>
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={cn(
                    "size-3.5 text-muted flex-shrink-0 transition-transform duration-150",
                    switcherOpen && "rotate-180"
                  )}
                />
              )}
            </button>

            {/* Switcher dropdown */}
            {switcherOpen && !isCollapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-raised border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {/* Current club */}
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[11px] text-muted uppercase tracking-wider font-medium mb-1">Current club</p>
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-brand flex-shrink-0" />
                    <span className="text-[13px] text-foreground font-medium truncate">
                      {currentClub?.name ?? clubSlug}
                    </span>
                    <span className="ml-auto text-[11px] text-muted capitalize flex-shrink-0">
                      {currentClub?.role}
                    </span>
                  </div>
                </div>

                {/* Other clubs */}
                {otherClubs.length > 0 && (
                  <div className="py-1">
                    {otherClubs.map((club) => (
                      <Link
                        key={club.slug}
                        href={`/${club.slug}/dashboard`}
                        onClick={() => setSwitcherOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-surface-subtle transition-colors"
                      >
                        <div className="size-5 rounded bg-border flex items-center justify-center flex-shrink-0">
                          <Building2 className="size-3 text-muted" />
                        </div>
                        <span className="text-[13px] text-foreground truncate flex-1">{club.name}</span>
                        <span className="text-[11px] text-muted capitalize flex-shrink-0">{club.role}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Create new club */}
                <div className="border-t border-border py-1">
                  <Link
                    href="/onboarding/new-club"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-surface-subtle transition-colors text-muted hover:text-foreground"
                  >
                    <Plus className="size-3.5 flex-shrink-0" />
                    <span className="text-[13px]">Create new club</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-md",
            isCollapsed ? "justify-center" : ""
          )}
          title={isCollapsed ? userName : undefined}
        >
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
              <span className="text-[13px] whitespace-nowrap transition-opacity duration-[120ms]">
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
      {active && (
        <span
          className="absolute left-0 inset-y-[4px] w-[3px] rounded-r-full bg-primary"
          aria-hidden="true"
        />
      )}
      <Icon className="size-5 flex-shrink-0" />
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

export function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 w-60 overflow-hidden bg-background border-r border-border">
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-border">
        <div className="size-8 rounded-md skeleton-shimmer flex-shrink-0" />
        <div className="h-4 w-16 rounded skeleton-shimmer" />
      </div>
      <div className="flex-1 py-3 px-2 space-y-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonNavItem key={i} />
        ))}
        <div className="my-2 h-px bg-border" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonNavItem key={`s${i}`} />
        ))}
      </div>
      <div className="flex-shrink-0 border-t border-border p-2 space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="size-5 rounded skeleton-shimmer flex-shrink-0" />
          <div className="h-3 w-32 rounded skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="size-7 rounded-full skeleton-shimmer flex-shrink-0" />
          <div className="h-3 w-24 rounded skeleton-shimmer" />
        </div>
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
