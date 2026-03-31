"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function DarkFooter() {
  return (
    <footer className="relative bg-[#141210] py-24 md:py-32 overflow-hidden border-t border-[#2E2A25]">
      {/* Atmospheric Ember Glow */}
      <div 
        className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] opacity-15 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(200, 74, 8, 0.4) 0%, transparent 65%)" }}
      />

      <div className="container relative mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#EDE8E2]">
            Ready to get back to work?
          </h2>
          <p className="mt-6 text-lg text-[#B5B0A8] leading-relaxed">
            Join the flow of gym owners and coaches who spend their time 
            where it matters most. On the mats, with their members.
          </p>
          
          <div className="mt-10 flex items-center justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--action-primary-bg)] px-10 py-5 text-xl font-medium text-white transition-all hover:bg-[var(--action-primary-bg-hover)] hover:scale-105 active:scale-95 shadow-lg shadow-[var(--action-primary-bg)]/20"
            >
              Join the flow
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </div>
        </motion.div>

        <div className="mt-24 pt-8 border-t border-[#1F1D1A] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--action-primary-bg)] flex items-center justify-center">
              <div className="h-3 w-3 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-[#EDE8E2]">ZENZO</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-[#726D67]">
            <Link href="/privacy" className="hover:text-[#EDE8E2] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#EDE8E2] transition-colors">Terms</Link>
            <p>© 2026 Zenzo. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
