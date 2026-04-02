"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-default)] bg-[var(--surface-page)]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[var(--action-primary-bg)] flex items-center justify-center flex-shrink-0">
            <div className="h-3 w-3 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-lg font-bold tracking-tighter text-[var(--text-primary)]">ZENZO</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/explore"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Explore clubs
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--action-primary-bg)] px-4 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-[var(--action-primary-bg-hover)]"
          >
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* Mobile: primary CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--action-primary-bg)] px-3 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-[var(--action-primary-bg-hover)]"
          >
            Get started
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-default)] bg-[var(--surface-page)] px-4 sm:px-6 py-4 space-y-4">
          <Link
            href="/explore"
            className="block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Explore clubs
          </Link>
          <Link
            href="/login"
            className="block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Sign in
          </Link>
        </div>
      )}
    </nav>
  );
}
