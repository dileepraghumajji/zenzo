"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, User } from "lucide-react";
import { cn } from "@zenzo/ui";

interface ConsumerNavProps {
  homeHref: string;
}

function getNavItems(homeHref: string) {
  return [
    { label: "Home",     href: homeHref,    icon: Home    },
    { label: "Discover", href: "/discover", icon: Compass },
    { label: "Search",   href: "/search",   icon: Search  },
    { label: "Profile",  href: "/profile",  icon: User    },
  ];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/portal" || href === "/discover") {
    return pathname === href || pathname.startsWith(href + "/");
  }
  return pathname.startsWith(href);
}

export function ConsumerNav({ homeHref }: ConsumerNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(homeHref);

  return (
    <>
      {/* Desktop horizontal links — placed inside header by layout */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary-subtle text-brand"
                  : "text-muted hover:text-foreground hover:bg-surface-raised"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile fixed bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-subtle border-t border-border safe-area-inset-bottom">
        <div className="flex items-stretch">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-brand" : "text-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "[stroke-width:2.5]")} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
