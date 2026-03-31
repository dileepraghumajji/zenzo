"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Check, Zap, Shield, Users, MessageSquare, CreditCard, Clock, Activity, Lock } from "lucide-react";

// --- STICKY SCROLL DATA ---
const STORY_STEPS: { id: string, title: string, description: string }[] = [
  {
    id: "ritual",
    title: "Attendance is a ritual. Not a form.",
    description: "Marking 20 students at 6:00 AM shouldn't be a struggle. Scan the room, tap the names, and you're done. No spreadsheets, no clutter. Designed for coach Arjun, ringside with sweaty hands.",
  },
  {
    id: "signal",
    title: "One morning briefing. One tea. One glance.",
    description: "Stop drowning in charts. Zenzo scans your members and payments to surface the one urgent thing that needs your attention today. If everything is clear, we stay out of your way.",
  }
];

export function FeatureSections() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Calculate which step is active based on scroll (0 to 1)
  const activeStepVariant = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, 0, 1, 1]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Sync motion value to state for triggering animations
  React.useEffect(() => {
    return activeStepVariant.onChange((v) => setActiveIdx(Math.round(v)));
  }, [activeStepVariant]);

  return (
    <div className="bg-[var(--surface-page)] relative z-10">

      {/* --- STICKY SCROLL SECTION --- */}
      <section ref={containerRef} className="relative h-[200vh]">
        {/* Sticky Container */}
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

              {/* Left: Text Content */}
              <div className="flex flex-col justify-center h-full max-w-xl pr-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIdx}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-brand)] text-[var(--text-brand)] shadow-sm border border-[var(--border-default)]">
                      {activeIdx === 0 ? <Users className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                      {STORY_STEPS[activeIdx]?.title ?? STORY_STEPS[0]?.title}
                    </h3>
                    <p className="mt-6 text-xl leading-relaxed text-[var(--text-secondary)]">
                      {STORY_STEPS[activeIdx]?.description ?? STORY_STEPS[0]?.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress Indicators */}
                <div className="mt-12 flex gap-3">
                  {STORY_STEPS.map((_, i) => (
                    <div key={i} className="h-1.5 w-12 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--action-primary-bg)] w-full origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: activeIdx >= i ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Visual Mockups */}
              <div className="relative h-[400px] md:h-[600px] w-full rounded-3xl border border-[var(--border-default)] bg-[var(--surface-raised)] shadow-2xl overflow-hidden flex items-center justify-center p-8 lg:p-12">
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=')] opacity-50" />

                <AnimatePresence mode="wait">
                  {activeIdx === 0 ? (
                    // RITUAL MOCKUP
                    <motion.div
                      key="visual-0"
                      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                      transition={{ duration: 0.6 }}
                      className="relative w-full max-w-sm space-y-4"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + (i * 0.1), type: "spring", stiffness: 100 }}
                          className={`flex items-center justify-between p-4 rounded-xl border ${i === 0
                              ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)]/30 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(22,163,74,0.2)]'
                              : 'bg-[var(--surface-page)] border-[var(--border-default)] opacity-60'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full ${i === 0 ? 'bg-[var(--action-primary-bg)]' : 'bg-[var(--surface-subtle)]'}`} />
                            <div className="space-y-2">
                              <div className={`h-3 w-24 rounded-full ${i === 0 ? 'bg-[var(--text-primary)]' : 'bg-[var(--surface-subtle)]'}`} />
                              <div className={`h-2 w-16 rounded-full ${i === 0 ? 'bg-[var(--text-secondary)]' : 'bg-[var(--surface-subtle)]'}`} />
                            </div>
                          </div>
                          {i === 0 && <Check className="text-[var(--status-success-text)]" />}
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    // SIGNAL MOCKUP
                    <motion.div
                      key="visual-1"
                      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                      transition={{ duration: 0.6 }}
                      className="relative w-full max-w-sm"
                    >
                      <div className="absolute -inset-4 bg-[var(--action-primary-bg)] opacity-10 blur-3xl rounded-full" />
                      <div className="relative bg-[var(--surface-brand)] border border-[var(--border-strong)] rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--action-primary-bg)]/10 text-[var(--action-primary-bg)] mb-6">
                          <Activity className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Today's Focus</p>
                        <p className="mt-4 text-6xl font-black text-[var(--text-primary)] tracking-tighter">₹18k</p>
                        <p className="mt-4 text-[var(--text-secondary)] font-medium">Overdue from 6 senior members.</p>
                        <div className="mt-8 pt-6 border-t border-[var(--border-default)]">
                          <button className="w-full rounded-lg bg-[var(--action-primary-bg)] py-3 text-sm font-bold text-white shadow-md">
                            Send Reminders
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- BENTO GRID INFRASTRUCTURE SECTION --- */}
      <section className="py-32 bg-[var(--surface-subtle)] relative overflow-hidden border-t border-[var(--border-default)]">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
              Infrastructure for effort.
            </h2>
            <p className="mt-6 text-xl text-[var(--text-secondary)] leading-relaxed">
              We built the unglamorous things perfectly, so you never have to think about them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Bento Item 1: Large Wide */}
            <BentoCard
              className="md:col-span-2 bg-[var(--surface-page)]"
              icon={<CreditCard className="h-8 w-8 text-[var(--action-primary-bg)]" />}
              title="Auto-Rolling Billing"
              desc="Set a quarterly fee, and Zenzo automatically shifts the next due date forward by exactly 3 months the moment you log a payment. Math disappears."
            />
            {/* Bento Item 2: Square */}
            <BentoCard
              className="bg-[var(--surface-brand)] border-[var(--text-brand)]/20"
              icon={<MessageSquare className="h-8 w-8 text-[var(--text-brand)]" />}
              title="WhatsApp Native"
              desc="Members don't want another app. Invite them directly via WhatsApp."
            />
            {/* Bento Item 3: Square */}
            <BentoCard
              className="bg-[var(--surface-page)]"
              icon={<Lock className="h-8 w-8 text-[var(--text-primary)]" />}
              title="Zero Shadow Accounts"
              desc="Members own their identity via phone OTP. No duplicate records."
            />
            {/* Bento Item 4: Large Wide */}
            <BentoCard
              className="md:col-span-2 bg-[var(--surface-page)]"
              icon={<Clock className="h-8 w-8 text-[var(--text-primary)]" />}
              title="Batches that Breathe"
              desc="Schedules that reflect reality. Add coaches, set timings, and let Zenzo handle the generation of daily roll calls automatically."
            />
          </div>
        </div>
      </section>

    </div>
  );
}

// Helper component for Bento cards with hover glows
function BentoCard({ className, icon, title, desc }: { className?: string, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-3xl border border-[var(--border-default)] p-8 shadow-sm hover:shadow-xl transition-all ${className}`}
    >
      {/* Subtle Hover Glow masking trick */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--action-primary-bg)]/0 to-[var(--action-primary-bg)]/0 group-hover:from-[var(--action-primary-bg)]/5 group-hover:to-transparent transition-all duration-500" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-auto">
          <div className="mb-6 inline-block rounded-2xl bg-[var(--surface-subtle)] p-4 border border-[var(--border-default)] shadow-inner transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            {icon}
          </div>
          <h4 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h4>
        </div>
        <p className="mt-4 text-base font-medium text-[var(--text-secondary)] leading-relaxed">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

