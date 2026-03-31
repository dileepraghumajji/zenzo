"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export function LandingHero() {
  // Tracking mouse for the 3D tilt effect on the mockup
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the raw mouse values
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  // Map mouse position to rotation ranges (tilt up/down, left/right)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate mouse position relative to center of element (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-24 md:pt-40 md:pb-32 bg-[var(--surface-page)]">
      {/* Absolute Background Blur Orb */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-[100%] bg-[var(--action-primary-bg)] opacity-10 blur-[140px] pointer-events-none" />

      <div className="container relative mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-[var(--text-primary)] leading-[1.05]">
              Spend your energy <br className="hidden md:block"/>
              <span className="text-[var(--text-tertiary)]">on the floor. </span> 
              <br className="md:hidden" />
              Not the paperwork.
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mt-8 max-w-2xl text-xl text-[var(--text-secondary)] leading-relaxed">
              Zenzo is management built for owners who’d rather be coaching. Fast, quiet, and invisible until you need it.
            </p>
          </motion.div>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center rounded-full bg-[var(--action-primary-bg)] px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-[var(--action-primary-bg-hover)] shadow-[0_0_40px_-10px_rgba(200,74,8,0.5)] hover:shadow-[0_0_60px_-15px_rgba(200,74,8,0.7)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started for free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-sm font-medium text-[var(--text-tertiary)] ml-4">No credit card required.</p>
          </motion.div>
        </div>

        {/* 3D Interactive Mockup Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 md:mt-32 max-w-4xl mx-auto perspective-1000"
        >
          {/* Tracking Layer */}
          <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative w-full rounded-[32px] border pb-4 md:pb-8 pt-6 border-[var(--border-default)] bg-[var(--surface-raised)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-2 md:p-4"
          >
            {/* Gloss Overlay */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-white/0 via-white/5 to-white/40 pointer-events-none" />
            
            {/* Header Content */}
            <div className="px-6 md:px-10 pb-6 mb-8 border-b border-[var(--border-default)] flex justify-between items-end relative" style={{ transform: "translateZ(40px)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">The Ritual</p>
                <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Morning Batch</h2>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--text-primary)] tracking-tighter">18</span>
                  <span className="text-xl font-medium text-[var(--text-tertiary)]">/ 18</span>
                </div>
                <p className="text-sm text-[var(--text-tertiary)] font-medium">Auto-saved</p>
              </div>
            </div>

            {/* List Content */}
            <div className="space-y-3 px-4 md:px-8 relative" style={{ transform: "translateZ(30px)" }}>
              {[
                { name: "Rahul Sharma", status: "present", time: "6:03 AM" },
                { name: "Deepa Gupta", status: "present", time: "6:05 AM" },
                { name: "Arjun Kumar", status: "present", time: "6:05 AM" },
              ].map((member, i) => (
                <div 
                  key={i} 
                  className="group flex items-center justify-between rounded-2xl px-5 py-4 bg-[var(--status-success-bg)] border border-[var(--status-success-border)]/20 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[var(--surface-page)] border border-[var(--status-success-border)]/30 flex items-center justify-center text-sm font-bold text-[var(--status-success-text)] shadow-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block text-base group-hover:text-[var(--status-success-text)] transition-colors">
                        {member.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--status-success-text)] opacity-70 hidden sm:block">{member.time}</span>
                    <div className="h-8 w-8 rounded-full bg-[var(--status-success-border)] flex items-center justify-center shadow-md">
                      <Check className="h-4 w-4 text-white stroke-[3]" />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Absent Member Row to show contrast */}
              <div className="group flex items-center justify-between rounded-2xl px-5 py-4 bg-[var(--status-error-bg)] border border-[var(--status-error-border)]/20 shadow-sm opacity-80 backdrop-blur-sm grayscale-[20%]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[var(--surface-page)] border border-[var(--status-error-border)]/30 flex items-center justify-center text-sm font-bold text-[var(--status-error-text)] shadow-sm">
                    PN
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text-secondary)] block text-base">
                      Priya Nair
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--status-error-text)]">Absent</span>
                </div>
              </div>
            </div>
            
          </motion.div>
        </motion.div>
      </div>

      {/* Global generic style to enable 3D perspective via tailwind mostly, fallback just in case */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 {
          perspective: 1000px;
        }
      `}} />
    </section>
  );
}
