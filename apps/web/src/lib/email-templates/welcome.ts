// Template: Welcome email
// Sent when a member's invite is accepted and membership becomes active.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zenzo.app";

export function welcomeEmailHtml({
  memberName,
  clubName,
  planName,
  portalUrl,
}: {
  memberName: string;
  clubName: string;
  planName: string | null;
  portalUrl: string;
}): string {
  const planLine = planName
    ? `<p style="margin:0 0 8px;font-size:14px;color:#374151">Your plan: <strong>${planName}</strong></p>`
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
          <p style="margin:0 0 16px;font-size:16px;color:#374151">Welcome, ${memberName}! 🎉</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
            You're now a member of <strong>${clubName}</strong>. Your membership is active.
          </p>
          ${planLine}
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6">
            Use Zenzo to track your attendance, view upcoming fees, and see your progress.
          </p>
          <a href="${portalUrl}"
             style="display:inline-block;padding:12px 28px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600">
            View My Membership →
          </a>
        </td></tr>

        <tr><td style="padding-top:32px;border-top:1px solid #f3f4f6;margin-top:32px">
          <p style="margin:0;font-size:12px;color:#9ca3af">
            <a href="${APP_URL}" style="color:#6b7280">zenzo.app</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
