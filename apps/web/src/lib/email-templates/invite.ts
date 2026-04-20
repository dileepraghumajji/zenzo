// Template: Club invite email
// Sent when a member who isn't on Zenzo yet is invited by a club owner.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zenzo.app";

export function inviteEmailHtml({
  memberName,
  clubName,
  inviterName,
  planName,
  signupUrl,
}: {
  memberName: string;
  clubName: string;
  inviterName: string;
  planName: string | null;
  signupUrl: string;
}): string {
  const planLine = planName
    ? `<p style="margin:0 0 8px">Plan: <strong>${planName}</strong></p>`
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
            <strong>${inviterName}</strong> has invited you to join
            <strong>${clubName}</strong> on Zenzo — the app for managing your
            fitness membership, attendance, and payments.
          </p>
          ${planLine}
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6">
            Create your free Zenzo account to accept the invite and get started.
          </p>
          <a href="${signupUrl}"
             style="display:inline-block;padding:12px 28px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600">
            Accept Invite &amp; Sign Up →
          </a>
        </td></tr>

        <tr><td style="padding-top:32px;border-top:1px solid #f3f4f6;margin-top:32px">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
            This invite expires in 30 days. If you didn't expect this, you can
            safely ignore this email.<br>
            <a href="${APP_URL}" style="color:#6b7280">zenzo.app</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
