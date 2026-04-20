// Template: Payment reminder email
// Sent when a membership flips to overdue status (cron job).

import { formatCurrency } from "@zenzo/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zenzo.app";

export function reminderEmailHtml({
  memberName,
  clubName,
  amountPaise,
  dueDate,
  portalUrl,
}: {
  memberName: string;
  clubName: string;
  amountPaise: number | null;
  dueDate: string;      // YYYY-MM-DD
  portalUrl: string;
}): string {
  const formattedDate = new Date(dueDate + "T00:00:00").toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const amountLine = amountPaise
    ? `<p style="margin:0 0 8px;font-size:14px;color:#374151">Amount due: <strong>${formatCurrency(amountPaise)}</strong></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb">

        <tr><td style="padding-bottom:24px;border-bottom:1px solid #f3f4f6">
          <p style="margin:0;font-size:22px;font-weight:700;color:#111">Zenzo</p>
        </td></tr>

        <tr><td style="padding:28px 0 0">
          <p style="margin:0 0 16px;font-size:16px;color:#374151">Hi ${memberName},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            Your membership fee for <strong>${clubName}</strong> was due on
            <strong>${formattedDate}</strong>. Please pay your coach or club directly at your earliest convenience.
          </p>
          ${amountLine}
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6">
            Once your payment is recorded by the club, your membership will be marked active again.
          </p>
          <a href="${portalUrl}"
             style="display:inline-block;padding:12px 28px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600">
            View My Membership →
          </a>
        </td></tr>

        <tr><td style="padding-top:32px;border-top:1px solid #f3f4f6;margin-top:32px">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
            Payments are made directly to the club — Zenzo only tracks them.<br>
            <a href="${APP_URL}" style="color:#6b7280">zenzo.app</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
