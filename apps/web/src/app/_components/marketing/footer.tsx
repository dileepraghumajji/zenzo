import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function DarkFooter() {
  return (
    <footer className="relative bg-[#141210] py-16 sm:py-24 md:py-32 overflow-hidden border-t border-[#2E2A25]">
      {/* Atmospheric ember glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] opacity-15 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(200, 74, 8, 0.4) 0%, transparent 65%)" }}
      />

      <div className="container relative mx-auto px-4 sm:px-6 text-center">
        <div className="footer-fadein max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[var(--action-primary-bg)] mb-4 sm:mb-6">
            Your next batch starts tomorrow
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-[#EDE8E2]">
            Be ready.
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#B5B0A8] leading-relaxed">
            Attendance in 30 seconds. Payments on autopilot. Zenzo handles the ops so you stay on the mat — starting tonight.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--action-primary-bg)] px-7 sm:px-10 py-4 sm:py-5 text-base sm:text-xl font-medium text-white transition-all hover:bg-[var(--action-primary-bg-hover)] hover:scale-105 active:scale-95 shadow-lg shadow-[var(--action-primary-bg)]/20"
            >
              Start for free
              <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <p className="text-xs sm:text-sm text-[#726D67]">No credit card · Free for clubs under 30 members</p>
          </div>
        </div>

        <div className="mt-16 sm:mt-24 pt-8 border-t border-[#1F1D1A] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--action-primary-bg)] flex items-center justify-center flex-shrink-0">
              <div className="h-3 w-3 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-[#EDE8E2]">ZENZO</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs sm:text-sm text-[#726D67]">
            <Link href="/privacy" className="hover:text-[#EDE8E2] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#EDE8E2] transition-colors">Terms</Link>
            <p>© 2026 Zenzo. All rights reserved.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes footerFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .footer-fadein {
          animation: footerFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.15s;
        }
      `}</style>
    </footer>
  );
}
