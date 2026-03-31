// ─── Communications Page ──────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/communications
//
// P0.8 — WhatsApp notifications via Interakt. Deferred pending API key + infra.

import { MessageSquare, Bell, Receipt, UserPlus, Trophy, AlertTriangle, Clock } from "lucide-react";

export const metadata = { title: "Communications" };

const PLANNED_NOTIFICATIONS = [
  {
    icon: Bell,
    title: "Payment Reminder",
    trigger: "3 days before due date + on due date",
    recipient: "Member",
  },
  {
    icon: Receipt,
    title: "Payment Receipt",
    trigger: "On payment recorded (if checkbox checked)",
    recipient: "Member",
  },
  {
    icon: UserPlus,
    title: "Welcome Message",
    trigger: "On member signup via invite link",
    recipient: "Member",
  },
  {
    icon: Trophy,
    title: "Belt / Level Promotion",
    trigger: "On owner logging a promotion",
    recipient: "Member",
  },
  {
    icon: AlertTriangle,
    title: "Attendance Alert",
    trigger: "Member absent 3+ consecutive sessions",
    recipient: "Owner",
  },
  {
    icon: Clock,
    title: "Expiry Warning",
    trigger: "7 days before membership expires",
    recipient: "Member",
  },
];

export default function CommunicationsPage() {
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[22px] font-bold text-foreground">Communications</h1>
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-surface-subtle border border-border text-muted px-2.5 py-0.5 rounded-full">
            Coming Soon
          </span>
        </div>
        <p className="text-[13px] text-muted">
          Automated WhatsApp notifications for payments, attendance, and promotions.
        </p>
      </div>

      {/* Provider note */}
      <div className="rounded-xl border border-border bg-surface-subtle px-4 py-3 mb-6 flex items-center gap-3">
        <MessageSquare className="w-4 h-4 text-muted flex-shrink-0" />
        <p className="text-[12px] text-muted">
          Powered by <span className="font-semibold text-foreground">Interakt</span> — all templates are pre-built and toggleable per club.
        </p>
      </div>

      {/* Notification type previews */}
      <div className="rounded-xl border border-border overflow-hidden opacity-40 pointer-events-none select-none">
        <div className="px-4 py-3 border-b border-border bg-surface-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            Notification Types
          </p>
        </div>
        <div className="divide-y divide-border">
          {PLANNED_NOTIFICATIONS.map(({ icon: Icon, title, trigger, recipient }) => (
            <div key={title} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{title}</p>
                <p className="text-[11px] text-muted truncate">{trigger}</p>
              </div>
              <span className="flex-shrink-0 text-[11px] text-muted border border-border rounded px-2 py-0.5">
                → {recipient}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-[12px] text-muted">
        WhatsApp communications will be available in an upcoming release.
      </p>
    </div>
  );
}
