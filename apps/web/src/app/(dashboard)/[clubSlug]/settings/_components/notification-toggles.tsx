"use client";

// ─── NotificationToggles ──────────────────────────────────────────────────────
// Per-toggle notification settings stored in clubs.terminology JSON:
//   notif_payment_reminder  — send reminder when payment is overdue
//   notif_attendance_alert  — send alert when attendance drops below threshold
//   notif_welcome_message   — send welcome message when member joins

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Switch } from "@zenzo/ui";

interface NotificationTogglesProps {
  clubSlug:         string;
  paymentReminder:  boolean;
  attendanceAlert:  boolean;
  welcomeMessage:   boolean;
}

export function NotificationToggles({
  clubSlug,
  paymentReminder:  initPayment,
  attendanceAlert:  initAttendance,
  welcomeMessage:   initWelcome,
}: NotificationTogglesProps) {
  const router = useRouter();

  const [paymentReminder, setPaymentReminder] = React.useState(initPayment);
  const [attendanceAlert, setAttendanceAlert] = React.useState(initAttendance);
  const [welcomeMessage,  setWelcomeMessage]  = React.useState(initWelcome);

  const [isLoading, setIsLoading] = React.useState(false);
  const [saved,     setSaved]     = React.useState(false);
  const [error,     setError]     = React.useState("");

  const handleSave = async () => {
    setIsLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/settings`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          terminology_patch: {
            notif_payment_reminder: paymentReminder,
            notif_attendance_alert: attendanceAlert,
            notif_welcome_message:  welcomeMessage,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <Switch
          id="paymentReminder"
          label="Payment Reminders"
          description="Notify members when their payment is overdue."
          checked={paymentReminder}
          onCheckedChange={setPaymentReminder}
        />
        <Switch
          id="attendanceAlert"
          label="Low Attendance Alert"
          description="Notify members when their monthly attendance drops below 50%."
          checked={attendanceAlert}
          onCheckedChange={setAttendanceAlert}
        />
        <Switch
          id="welcomeMessage"
          label="Welcome Message"
          description="Send a welcome message when a new member's invite is accepted."
          checked={welcomeMessage}
          onCheckedChange={setWelcomeMessage}
        />
      </div>

      <p className="text-[12px] text-muted">
        Note: actual delivery requires WhatsApp (P0.8) or email (Sprint N) to be configured.
      </p>

      {error && <p className="text-[13px] text-error-foreground">{error}</p>}

      <div className="flex items-center gap-3">
        <Button variant="primary" disabled={isLoading} onClick={handleSave}>
          {isLoading ? "Saving…" : "Save"}
        </Button>
        {saved && (
          <p className="text-[13px] text-success-foreground font-medium">Saved ✓</p>
        )}
      </div>
    </div>
  );
}
