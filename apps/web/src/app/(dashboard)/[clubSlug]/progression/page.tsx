// ─── Progression Page ─────────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/progression
//
// P1.1 — Belt / level tracking. Coming in Phase 1.5.
// Visible to both owners (secondary nav) and coaches (primary nav).

import { Trophy, List, TrendingUp, MessageSquare } from "lucide-react";

export const metadata = { title: "Progression" };

const PLANNED_FEATURES = [
  {
    icon: List,
    title: "Level Configuration",
    description: "Define your belt or grade hierarchy — Yellow Belt, Grade 2, etc. Drag to reorder. Pre-built sets for martial arts and dance.",
  },
  {
    icon: TrendingUp,
    title: "Belt Distribution",
    description: "Visual bar showing how many members are at each level. Spot gaps at a glance.",
  },
  {
    icon: Trophy,
    title: "Log a Promotion",
    description: "Record a member's promotion with from/to level, date, and notes. Full history preserved.",
  },
  {
    icon: MessageSquare,
    title: "Promotion Congratulations",
    description: "Automatic WhatsApp message sent to the member on promotion (if Communications is enabled).",
  },
];

export default function ProgressionPage() {
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[22px] font-bold text-foreground">Progression</h1>
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-surface-subtle border border-border text-muted px-2.5 py-0.5 rounded-full">
            Coming Soon
          </span>
        </div>
        <p className="text-[13px] text-muted">
          Track belt grades and level promotions for your members.
        </p>
      </div>

      {/* Feature preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-40 pointer-events-none select-none">
        {PLANNED_FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-background p-5 flex gap-4"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-subtle flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground mb-1">{title}</p>
              <p className="text-[12px] text-muted leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enable note */}
      <div className="mt-8 rounded-xl border border-border bg-surface-subtle px-4 py-3">
        <p className="text-[12px] text-muted text-center">
          Progression can be enabled per club in{" "}
          <span className="font-semibold text-foreground">Settings → Customization</span> once available.
        </p>
      </div>
    </div>
  );
}
