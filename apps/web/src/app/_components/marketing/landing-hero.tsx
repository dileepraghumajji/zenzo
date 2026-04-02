"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

const CLUB_CATEGORIES = [
  {
    label: "Gym",
    emoji: "🏋️",
    batchLabel: "Morning Strength — Powai, Mumbai",
    completedIn: "42s",
    subtext: "gyms and fitness centres",
    members: [
      { initials: "RS", name: "Rahul Sharma" },
      { initials: "VK", name: "Vikram Kapoor" },
      { initials: "DG", name: "Deepa Gupta" },
      { initials: "AK", name: "Arjun Kumar" },
      { initials: "SR", name: "Siddharth Rao" },
    ],
    absentMember: { initials: "NK", name: "Nisha Kapoor" },
  },
  {
    label: "Martial Arts",
    emoji: "🥋",
    batchLabel: "6 AM Kickboxing — Andheri West",
    completedIn: "38s",
    subtext: "martial arts academies",
    members: [
      { initials: "RS", name: "Rahul Sharma" },
      { initials: "DG", name: "Deepa Gupta" },
      { initials: "AK", name: "Arjun Kumar" },
      { initials: "SR", name: "Siddharth Rao" },
      { initials: "MP", name: "Meera Pillai" },
    ],
    absentMember: { initials: "PN", name: "Priya Nair" },
  },
  {
    label: "Dance",
    emoji: "💃",
    batchLabel: "Evening Batch — Koramangala, Bangalore",
    completedIn: "51s",
    subtext: "dance academies",
    members: [
      { initials: "AN", name: "Anjali Nair" },
      { initials: "KR", name: "Kavya Reddy" },
      { initials: "SM", name: "Sneha Menon" },
      { initials: "PS", name: "Priya Sharma" },
      { initials: "NI", name: "Nandini Iyer" },
    ],
    absentMember: { initials: "AR", name: "Asha Rao" },
  },
  {
    label: "Yoga",
    emoji: "🧘",
    batchLabel: "Sunrise Session — Baner, Pune",
    completedIn: "35s",
    subtext: "yoga studios",
    members: [
      { initials: "MP", name: "Meera Pillai" },
      { initials: "AS", name: "Ananya Singh" },
      { initials: "DG", name: "Deepa Gupta" },
      { initials: "RN", name: "Rohini Nair" },
      { initials: "KS", name: "Kavita Singh" },
    ],
    absentMember: { initials: "TG", name: "Tanvi Gupta" },
  },
] as const;

export function LandingHero() {
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(1);
  const category = CLUB_CATEGORIES[activeCategoryIdx] ?? CLUB_CATEGORIES[1];

  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-24 md:pt-40 md:pb-32 bg-[var(--surface-page)]">
      {/* Background blur orb */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] sm:h-[600px] sm:w-[800px] rounded-[100%] bg-[var(--action-primary-bg)] opacity-10 blur-[140px] pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">

          {/* Problem-first opener */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-raised)] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] shadow-sm"
          >
            You didn&apos;t open a gym to chase payments on WhatsApp.
          </motion.div>

          {/* Headline — scales from 4xl on tiny phones up to 8xl on large screens */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-[var(--text-primary)] leading-[1.05]"
          >
            Run your gym<br className="hidden sm:block" />
            <span className="text-[var(--text-tertiary)]"> from the mat,</span>
            <br />
            not a spreadsheet.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed"
          >
            Zenzo manages attendance, billing, and member communication for{" "}
            <AnimatePresence mode="wait">
              <motion.span
                key={activeCategoryIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="font-semibold text-[var(--text-primary)]"
              >
                {category.subtext}
              </motion.span>
            </AnimatePresence>
            {" "}— so you can stay on the floor.
          </motion.p>

          {/* Category selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {CLUB_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategoryIdx(i)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeCategoryIdx === i
                    ? "border-[var(--action-primary-bg)] bg-[var(--action-primary-bg)] text-white shadow-md"
                    : "border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--action-primary-bg)]/50 hover:text-[var(--text-primary)]"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center rounded-full bg-[var(--action-primary-bg)] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all hover:bg-[var(--action-primary-bg-hover)] shadow-[0_0_40px_-10px_rgba(200,74,8,0.5)] hover:shadow-[0_0_60px_-15px_rgba(200,74,8,0.7)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              See how it works
              <ChevronDown className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Pricing signal */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-3 text-xs sm:text-sm text-[var(--text-tertiary)]"
          >
            Free for clubs under 30 members. Plans from ₹999/mo.
          </motion.p>
        </div>

        {/* 3D Interactive Mockup — QR Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 sm:mt-24 md:mt-32 max-w-4xl mx-auto [perspective:1000px]"
        >
          <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative w-full rounded-2xl sm:rounded-[32px] border border-[var(--border-default)] bg-[var(--surface-raised)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <div className="absolute inset-0 rounded-2xl sm:rounded-[32px] bg-gradient-to-tr from-white/0 via-white/5 to-white/40 pointer-events-none z-10" />

            {/* Header */}
            <div
              className="px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-b border-[var(--border-default)] flex items-center justify-between"
              style={{ transform: "translateZ(40px)" }}
            >
              <div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`label-${activeCategoryIdx}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
                  >
                    {category.batchLabel}
                  </motion.p>
                </AnimatePresence>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5">
                  QR Attendance
                </h2>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-right">
                  <div className="flex items-baseline gap-0.5 justify-end">
                    <span className="text-xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
                      {category.members.length}
                    </span>
                    <span className="text-sm sm:text-lg font-medium text-[var(--text-tertiary)]">
                      /{category.members.length + 1}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--status-success-text)] font-semibold">checked in</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--status-success-bg)] border border-[var(--status-success-border)]/30 px-2.5 sm:px-3 py-1 sm:py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)] animate-pulse" />
                  <span className="text-xs font-bold text-[var(--status-success-text)]">Live</span>
                </div>
              </div>
            </div>

            {/* Body: QR code left, live scan feed right */}
            <div
              className="grid grid-cols-1 sm:grid-cols-[200px_1fr] md:grid-cols-[240px_1fr]"
              style={{ transform: "translateZ(30px)" }}
            >
              {/* QR column */}
              <div className="flex flex-col items-center justify-center p-5 sm:p-8 border-b sm:border-b-0 sm:border-r border-[var(--border-default)] bg-[var(--surface-subtle)]">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-2xl bg-[var(--action-primary-bg)]/15 animate-pulse" />
                  <div className="relative bg-white rounded-2xl p-3 sm:p-4 shadow-lg">
                    <QRCodeSVG
                      value={`https://zenzo.app/checkin?b=batch_${activeCategoryIdx}&t=demo_tok_2026`}
                      size={100}
                      bgColor="#ffffff"
                      fgColor="#111111"
                      level="M"
                      marginSize={0}
                    />
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 text-center">
                  <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Scan to check in</p>
                  <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] mt-0.5">Valid for today only</p>
                </div>
              </div>

              {/* Live scan feed */}
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                    Live check-ins
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`time-${activeCategoryIdx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-bold text-[var(--status-success-text)]"
                    >
                      Done in {category.completedIn}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`feed-${activeCategoryIdx}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                  >
                    {category.members.map((member, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--status-success-bg)] border border-[var(--status-success-border)]/20"
                      >
                        <div className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0 rounded-full bg-[var(--action-primary-bg)] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm">
                          {member.initials}
                        </div>
                        <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] flex-1 min-w-0 truncate">
                          {member.name}
                        </span>
                        <div className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 rounded-full bg-[var(--status-success-border)] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white stroke-[3]" />
                        </div>
                      </div>
                    ))}

                    {/* Absent */}
                    <div className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--surface-page)] border border-[var(--border-default)] opacity-55">
                      <div className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0 rounded-full bg-[var(--surface-subtle)] text-[var(--text-tertiary)] flex items-center justify-center text-[10px] sm:text-xs font-bold">
                        {category.absentMember.initials}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-[var(--text-secondary)] flex-1 min-w-0 truncate">
                        {category.absentMember.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] flex-shrink-0">
                        Absent
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
