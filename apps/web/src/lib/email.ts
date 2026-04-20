// ─── Email helper ──────────────────────────────────────────────────────────────
//
// Thin wrapper around Resend.
// Always fire-and-forget from API routes — never block the response on email.
//
// Usage:
//   import { sendEmail } from "@/lib/email";
//   await sendEmail({ to: "user@example.com", subject: "...", html: "..." });

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Zenzo <no-reply@mail.zenzo.app>";

/** Returns false only when the toggle is explicitly set to false. Defaults to enabled. */
export function isNotifEnabled(
  terminology: Record<string, unknown> | null | undefined,
  key: string
): boolean {
  return (terminology ?? {})[key] !== false;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Dev / CI: skip silently rather than crashing
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return;
  }

  const { error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) {
    // Log but never throw — email failure must not break the primary action
    console.error("[email] send failed:", error);
  }
}
