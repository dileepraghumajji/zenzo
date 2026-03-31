"use client";

// ─── Tabs ──────────────────────────────────────────────────────────────────────
//
// Zenzo-styled wrapper around @radix-ui/react-tabs.
//
// Design rules (from design system):
//   - Tab list: horizontal, border-b border-border (the line lives on the list)
//   - Active tab: forge-600 bottom border (2px), forge-600 text (text-brand)
//   - Inactive tab: stone-500 (muted), hover → stone-700 (foreground)
//   - No background on tabs — understated, content-first
//   - On mobile: tabs scroll horizontally (scrollbar-none)
//   - Tab content: no padding (consumer controls the spacing)
//
// Usage:
//   <Tabs defaultValue="overview">
//     <TabsList>
//       <TabsTrigger value="overview">Overview</TabsTrigger>
//       <TabsTrigger value="attendance">Attendance</TabsTrigger>
//     </TabsList>
//     <TabsContent value="overview"><OverviewPanel /></TabsContent>
//     <TabsContent value="attendance"><AttendancePanel /></TabsContent>
//   </Tabs>

import * as React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "../lib/cn";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const Tabs        = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

// ─── TabsList ─────────────────────────────────────────────────────────────────

export const TabsList = React.forwardRef<
  React.ElementRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn(
      // Layout — horizontal row that scrolls on mobile
      "flex items-end",
      "border-b border-border",
      "overflow-x-auto scrollbar-none",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

// ─── TabsTrigger ──────────────────────────────────────────────────────────────

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      // Layout
      "relative inline-flex items-center justify-center shrink-0",
      "h-10 px-4",
      // Typography
      "text-[14px] font-medium whitespace-nowrap",
      // Default: muted text
      "text-muted",
      // The active indicator — 2px forge line at bottom
      // Using a pseudo-element via data-state
      "border-b-2 border-transparent",
      "-mb-px", // overlap the list's border-b
      // Hover
      "hover:text-foreground transition-colors duration-150",
      // Active state
      "data-[state=active]:border-primary data-[state=active]:text-brand",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      // Disabled
      "disabled:pointer-events-none disabled:opacity-50",
      // Tap target
      "min-h-[44px] md:min-h-10",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";
