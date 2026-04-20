"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LandingHero } from "./landing-hero";

const FeatureSections = dynamic(
  () => import("./features").then((m) => ({ default: m.FeatureSections })),
);

interface Stats {
  activeClubs: number;
  weeklyAttendance: number;
}

function formatCount(n: number): string {
  if (n === 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
  return `${n}+`;
}

export function MarketingContent({ stats }: { stats: Stats }) {
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(1);

  return (
    <>
      <LandingHero
        activeCategoryIdx={activeCategoryIdx}
        onCategoryChange={setActiveCategoryIdx}
      />

      {/* Social Proof Bar */}
      <div className="border-y border-[var(--border-default)] bg-[var(--surface-subtle)] py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
            <div>
              <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {formatCount(stats.activeClubs)}
              </p>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                Clubs active
              </p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-[var(--border-default)]" />
            <div>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {formatCount(stats.weeklyAttendance)}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--status-success-text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)] animate-pulse" />
                  live
                </span>
              </div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                Attendance marks this week
              </p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-[var(--border-default)]" />
            <div className="flex items-center gap-2">
              <span className="text-lg">🇮🇳</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Built in India, for India</p>
                <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">₹ native · WhatsApp-first</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeatureSections activeCategoryIdx={activeCategoryIdx} />
    </>
  );
}
