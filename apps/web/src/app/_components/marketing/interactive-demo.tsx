"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Check, AlertTriangle, RotateCcw, Clock } from "lucide-react";

const OVERDUE_MEMBERS = [
  { id: "1", initials: "RS", name: "Rahul Sharma",  amount: "₹3,600", days: 14 },
  { id: "2", initials: "DG", name: "Deepa Gupta",   amount: "₹2,400", days: 7  },
  { id: "3", initials: "AK", name: "Arjun Kumar",   amount: "₹4,800", days: 21 },
  { id: "4", initials: "MP", name: "Meera Pillai",  amount: "₹3,600", days: 3  },
  { id: "5", initials: "SR", name: "Siddharth Rao", amount: "₹1,800", days: 9  },
];

export function InteractiveDemo() {
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const [sending, setSending]   = useState<string | null>(null);

  const sendReminder = (id: string) => {
    if (reminded.has(id) || sending !== null) return;
    setSending(id);
    setTimeout(() => {
      setReminded((prev) => new Set([...prev, id]));
      setSending(null);
    }, 700);
  };

  const reset = () => {
    setReminded(new Set());
    setSending(null);
  };

  const isDone   = reminded.size === OVERDUE_MEMBERS.length;
  const progress = OVERDUE_MEMBERS.length > 0 ? reminded.size / OVERDUE_MEMBERS.length : 0;

  return (
    <section className="py-20 sm:py-28 border-t border-[var(--border-default)] bg-[var(--surface-subtle)]">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">

            {/* ── Left: copy (sticky on desktop) ──────────── */}
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--action-primary-bg)] mb-4">
                Try it yourself
              </p>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                Chasing dues.<br />That ends here.
              </h2>

              <p className="mt-5 sm:mt-6 text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed">
                Tap{" "}
                <span className="font-semibold text-[var(--text-primary)]">Send Reminder</span>{" "}
                on each overdue member. Zenzo opens a pre-filled WhatsApp message.
                They get the nudge — you get paid.
              </p>

              {/* Progress */}
              <div className="mt-8 sm:mt-10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    {reminded.size} of {OVERDUE_MEMBERS.length} reminders sent
                  </span>
                  <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--surface-page)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#25D366]"
                    style={{ transformOrigin: "left", scaleX: 0 }}
                    animate={{ scaleX: progress }}
                    transition={{ type: "spring", stiffness: 90, damping: 20 }}
                  />
                </div>
              </div>

              {/* Done card */}
              <AnimatePresence>
                {isDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="mt-8 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/8 p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                        <Check className="h-5 w-5 text-white stroke-[2.5]" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)] text-base sm:text-lg leading-tight">
                          ₹16,200 in reminders sent.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                          Zero copy-paste. Zero open tabs. Your members got the message.
                        </p>
                        <button
                          onClick={reset}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--action-primary-bg)] hover:underline transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Try again
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right: overdue panel ─────────────────────── */}
            <div className="space-y-3">

              {/* Header chip */}
              <div className="flex items-center justify-between rounded-2xl border border-[var(--status-error-border)]/40 bg-[var(--status-error-bg)] px-4 sm:px-5 py-3.5 sm:py-4">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-[var(--status-error-text)]" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">5 members overdue</span>
                </div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-[var(--status-error-text)]">
                  ₹16,200
                </span>
              </div>

              {/* Cards */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)] overflow-hidden shadow-sm divide-y divide-[var(--border-default)]">
                {OVERDUE_MEMBERS.map((member, index) => {
                  const isReminded = reminded.has(member.id);
                  const isSending  = sending === member.id;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 transition-colors duration-300 ${
                        isReminded ? "bg-[#25D366]/5" : ""
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                          isReminded
                            ? "bg-[#25D366]/20 text-[#25D366]"
                            : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {member.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate transition-colors duration-300 ${
                            isReminded ? "text-[var(--text-tertiary)]" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {member.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isReminded ? "text-[var(--text-tertiary)]" : "text-[var(--status-error-text)]"
                            }`}
                          >
                            {member.amount}
                          </span>
                          <span className="text-[var(--border-strong)] text-xs">·</span>
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <Clock className="h-3 w-3" />
                            {member.days}d overdue
                          </span>
                        </div>
                      </div>

                      {/* WhatsApp CTA */}
                      <motion.button
                        onClick={() => sendReminder(member.id)}
                        disabled={isReminded || sending !== null}
                        whileTap={!isReminded && sending === null ? { scale: 0.88 } : {}}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-xs font-bold transition-all duration-300 ${
                          isReminded
                            ? "cursor-default bg-[#25D366]/15 text-[#25D366]"
                            : sending !== null
                            ? "cursor-not-allowed bg-[var(--surface-subtle)] text-[var(--text-tertiary)]"
                            : "cursor-pointer bg-[#25D366] text-white shadow-sm hover:bg-[#1da851] hover:shadow-md active:scale-95"
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {isReminded ? (
                            <motion.span
                              key="done"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1.5"
                            >
                              <Check className="h-3 w-3 stroke-[2.5]" />
                              Sent
                            </motion.span>
                          ) : isSending ? (
                            <motion.span key="loading" className="flex items-center gap-1.5">
                              <span className="h-3 w-3 rounded-full border-[1.5px] border-white/40 border-t-white animate-spin" />
                              Sending
                            </motion.span>
                          ) : (
                            <motion.span key="idle" className="flex items-center gap-1.5">
                              <MessageCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">Remind</span>
                              <span className="sm:hidden">Send</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-[var(--text-tertiary)] pt-1 pb-1">
                Opens a pre-filled WhatsApp message · no copy-paste required
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
