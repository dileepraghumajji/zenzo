"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap, CalendarDays, MessageSquare, CreditCard, Clock, Lock, AlertTriangle, MessageCircle } from "lucide-react";

const STORY_STEPS = [
  {
    id: "batches",
    title: "Your coaches walk in prepared.",
    description:
      "Every batch has a roster, a coach, and a fixed schedule. When 6 AM hits, your coach opens Zenzo and sees exactly who to expect — no confusion, no missed names. Configure it once, Zenzo generates the roll call every single day.",
  },
  {
    id: "payments",
    title: "Overdue? One tap. Done.",
    description:
      "Zenzo tracks every member's payment cycle automatically. When someone slips past their due date, you see exactly who, how much, and for how long. Tap Send Reminder — a pre-filled WhatsApp message goes straight to their phone. Zero chasing.",
  },
] as const;

const OVERDUE_PREVIEW = [
  { initials: "RS", name: "Rahul Sharma",  amount: "₹3,600", days: "12d" },
  { initials: "DG", name: "Deepa Gupta",   amount: "₹2,400", days: "5d"  },
  { initials: "AK", name: "Arjun Kumar",   amount: "₹4,800", days: "21d" },
];

export function FeatureSections() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Purely scroll-driven — no useState, no re-renders during scroll
  const step0Opacity  = useTransform(scrollYProgress, [0, 0.42, 0.58, 1], [1, 1, 0, 0]);
  const step0Y        = useTransform(scrollYProgress, [0.42, 0.58], [0, -24]);
  const step1Opacity  = useTransform(scrollYProgress, [0, 0.42, 0.58, 1], [0, 0, 1, 1]);
  const step1Y        = useTransform(scrollYProgress, [0.42, 0.58], [24, 0]);
  const visual0Opacity = useTransform(scrollYProgress, [0, 0.42, 0.58, 1], [1, 1, 0, 0]);
  const visual1Opacity = useTransform(scrollYProgress, [0, 0.42, 0.58, 1], [0, 0, 1, 1]);
  const bar0Scale     = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 1]);
  const bar1Scale     = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 1]);

  return (
    <div className="bg-[var(--surface-page)] relative z-10">

      {/* ── STICKY SCROLL ──────────────────────────────────── */}
      <section ref={containerRef} className="relative h-[300vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-24 items-center">

              {/* Left: stacked text, cross-faded by scroll */}
              <div className="flex flex-col gap-6 sm:gap-10 lg:gap-12 lg:pr-8">
                <div className="relative min-h-[220px] sm:min-h-[280px] md:min-h-[320px]">

                  {/* Step 0 — Batches & coaches */}
                  <motion.div
                    style={{ opacity: step0Opacity, y: step0Y }}
                    className="absolute inset-0 flex flex-col justify-center"
                  >
                    <div className="mb-4 sm:mb-6 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-[var(--surface-brand)] text-[var(--text-brand)] shadow-sm border border-[var(--border-default)]">
                      <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                      {STORY_STEPS[0].title}
                    </h3>
                    <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl leading-relaxed text-[var(--text-secondary)]">
                      {STORY_STEPS[0].description}
                    </p>
                  </motion.div>

                  {/* Step 1 — Payments & overdue */}
                  <motion.div
                    style={{ opacity: step1Opacity, y: step1Y }}
                    className="absolute inset-0 flex flex-col justify-center"
                  >
                    <div className="mb-4 sm:mb-6 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-[var(--surface-brand)] text-[var(--text-brand)] shadow-sm border border-[var(--border-default)]">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                      {STORY_STEPS[1].title}
                    </h3>
                    <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl leading-relaxed text-[var(--text-secondary)]">
                      {STORY_STEPS[1].description}
                    </p>
                  </motion.div>
                </div>

                {/* Scroll progress indicators */}
                <div className="flex gap-3">
                  {([bar0Scale, bar1Scale] as const).map((scaleX, i) => (
                    <div key={i} className="h-1.5 w-12 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--action-primary-bg)] w-full origin-left"
                        style={{ scaleX }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: visuals — hidden on mobile to avoid overflow in h-screen */}
              <div className="hidden lg:block relative h-[500px] xl:h-[580px] w-full rounded-3xl border border-[var(--border-default)] bg-[var(--surface-raised)] shadow-2xl overflow-hidden">
                {/* Dot pattern background */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: "radial-gradient(circle, var(--border-default) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* ── Visual 0: Batch card ─────────────────── */}
                <motion.div
                  style={{ opacity: visual0Opacity }}
                  className="absolute inset-0 flex items-center justify-center p-10 lg:p-12"
                >
                  <div className="w-full max-w-sm rounded-2xl bg-[var(--surface-page)] border border-[var(--border-default)] shadow-xl overflow-hidden">

                    {/* Batch header */}
                    <div className="px-6 py-5 border-b border-[var(--border-default)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--action-primary-bg)] mb-1">
                            Active Batch
                          </p>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                            6 AM Kickboxing
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            {["Mon", "Wed", "Fri"].map((d) => (
                              <span
                                key={d}
                                className="rounded-full bg-[var(--surface-subtle)] border border-[var(--border-default)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]"
                              >
                                {d}
                              </span>
                            ))}
                            <span className="text-xs text-[var(--text-tertiary)] ml-0.5">
                              06:00 – 07:30
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-xl shadow-inner">
                          🥋
                        </div>
                      </div>
                    </div>

                    {/* Coach row */}
                    <div className="px-6 py-4 border-b border-[var(--border-default)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-3">
                        Coach
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-[var(--action-primary-bg)] text-white flex items-center justify-center text-xs font-bold shadow-md">
                          AM
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Arjun Mehta</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Head Coach · 3 batches</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[var(--status-success-text)]" />
                          <span className="text-xs font-semibold text-[var(--status-success-text)]">Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance progress */}
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                          Today&apos;s Attendance
                        </p>
                        <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">23 / 25</p>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--action-primary-bg)] transition-all"
                          style={{ width: "92%" }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-[var(--status-success-text)] mt-2">
                        92% present · Marked via QR
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* ── Visual 1: Overdue members + WhatsApp CTA ── */}
                <motion.div
                  style={{ opacity: visual1Opacity }}
                  className="absolute inset-0 flex items-center justify-center p-10 lg:p-12"
                >
                  <div className="w-full max-w-sm rounded-2xl bg-[var(--surface-page)] border border-[var(--border-default)] shadow-xl overflow-hidden">

                    {/* Overdue header */}
                    <div className="px-5 py-4 bg-[var(--status-error-bg)] border-b border-[var(--status-error-border)]/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[var(--status-error-text)]" />
                        <span className="text-sm font-bold text-[var(--text-primary)]">Overdue Members</span>
                      </div>
                      <span className="text-base font-black tracking-tight text-[var(--status-error-text)]">
                        ₹10,800
                      </span>
                    </div>

                    {/* Member rows */}
                    <div className="divide-y divide-[var(--border-default)]">
                      {OVERDUE_PREVIEW.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-[var(--status-error-bg)] text-[var(--status-error-text)] flex items-center justify-center text-xs font-bold">
                            {m.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                              {m.amount} · {m.days} overdue
                            </p>
                          </div>
                          <div className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                            <MessageCircle className="h-3 w-3" />
                            Remind
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-[var(--surface-subtle)] border-t border-[var(--border-default)] flex items-center justify-between">
                      <p className="text-xs text-[var(--text-tertiary)]">3 of 47 members overdue</p>
                      <p className="text-xs font-bold text-[#25D366]">via WhatsApp</p>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 border-t border-[var(--border-default)]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-10 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--action-primary-bg)] mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
              Up and running before your first batch.
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-[var(--text-secondary)] leading-relaxed">
              Three steps. No onboarding call required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            {[
              {
                step: "01",
                title: "Create your club",
                desc: "Set up your club profile, add your batches, and configure fee plans. Takes about 2 minutes.",
                detail: "No card needed to start.",
              },
              {
                step: "02",
                title: "Invite your members",
                desc: "Share a WhatsApp invite link. Members sign up on Zenzo and their profile is linked to your club.",
                detail: "Members own their own profile.",
              },
              {
                step: "03",
                title: "Run your club on autopilot",
                desc: "QR check-ins mark attendance instantly. Payments track themselves. Overdue reminders go out in one tap.",
                detail: "Average check-in: 3 seconds.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 sm:gap-6">
                <span className="flex-shrink-0 text-3xl sm:text-5xl font-black text-[var(--border-strong)] leading-none tracking-tighter">
                  {item.step}
                </span>
                <div className="pt-1 sm:pt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-2 sm:mb-3">{item.desc}</p>
                  <p className="text-xs sm:text-sm font-semibold text-[var(--action-primary-bg)]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 lg:py-32 bg-[var(--surface-subtle)] relative overflow-hidden border-t border-[var(--border-default)]">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mb-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
              The boring stuff, done perfectly.
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-[var(--text-secondary)] leading-relaxed">
              We built the unglamorous things so you never have to think about them.
            </p>
          </div>

          <p className="mb-10 sm:mb-16 text-xs sm:text-sm font-medium text-[var(--text-tertiary)]">
            Built for martial arts academies · CrossFit boxes · yoga studios · dance schools · every club that runs on discipline.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[220px] sm:auto-rows-[250px]">
            <BentoCard
              className="md:col-span-2 bg-[var(--surface-page)]"
              icon={<CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--action-primary-bg)]" />}
              title="Auto-Rolling Billing"
              desc="Set a quarterly fee once. The moment you log a payment, Zenzo shifts the next due date forward by exactly 3 months. Math disappears, overdue alerts appear."
            />
            <BentoCard
              className="bg-[var(--surface-brand)] border-[var(--text-brand)]/20"
              icon={<MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--text-brand)]" />}
              title="WhatsApp Native"
              desc="Members don't want another app. Invite them via WhatsApp — they sign up once and they're in."
            />
            <BentoCard
              className="bg-[var(--surface-page)]"
              icon={<Lock className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--text-primary)]" />}
              title="One Real Profile Per Member"
              desc="No duplicate entries, fake names, or phantom memberships. Every member owns their identity across every club they join."
            />
            <BentoCard
              className="md:col-span-2 bg-[var(--surface-page)]"
              icon={<Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--text-primary)]" />}
              title="Batches that Breathe"
              desc="Set your schedule once. Zenzo auto-generates daily roll calls for each batch — coaches see their list the moment they open the app."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function BentoCard({
  className,
  icon,
  title,
  desc,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border-default)] p-5 sm:p-8 shadow-sm hover:shadow-xl transition-all ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--action-primary-bg)]/0 to-[var(--action-primary-bg)]/0 group-hover:from-[var(--action-primary-bg)]/5 group-hover:to-transparent transition-all duration-500" />
      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-auto">
          <div className="mb-4 sm:mb-6 inline-block rounded-xl sm:rounded-2xl bg-[var(--surface-subtle)] p-3 sm:p-4 border border-[var(--border-default)] shadow-inner transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            {icon}
          </div>
          <h4 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h4>
        </div>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-[var(--text-secondary)] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}
