// Template: Payment receipt email
// Sent to the member after a payment is recorded by the club.

import { formatCurrency } from "@zenzo/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zenzo.app";

export function receiptEmailHtml({
  memberName,
  clubName,
  amountPaise,
  paymentDate,
  method,
  planName,
  reference,
  note,
  receiptUrl,
}: {
  memberName: string;
  clubName: string;
  amountPaise: number;
  paymentDate: string;      // YYYY-MM-DD
  method: string;
  planName: string | null;
  reference: string | null;
  note: string | null;
  receiptUrl: string;
}): string {
  const formattedDate = new Date(paymentDate + "T00:00:00").toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const methodLabel: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };

  const rows = [
    ["Amount", formatCurrency(amountPaise)],
    ["Date", formattedDate],
    ["Method", methodLabel[method] ?? method],
    ...(planName ? [["Plan", planName] as [string, string]] : []),
    ...(reference ? [["Reference", reference] as [string, string]] : []),
    ...(note ? [["Note", note] as [string, string]] : []),
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:10px 0;font-size:13px;color:#6b7280;width:120px;vertical-align:top">${label}</td>
      <td style="padding:10px 0;font-size:13px;color:#111;font-weight:500">${value}</td>
    </tr>`
    )
    .join("");

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
          <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">✓ Payment Recorded</p>
          <p style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111">${formatCurrency(amountPaise)}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151">
            Hi ${memberName}, your payment to <strong>${clubName}</strong> has been recorded.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6">
            ${tableRows}
          </table>
          <div style="margin-top:28px">
            <a href="${receiptUrl}"
               style="display:inline-block;padding:11px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
              View Receipt →
            </a>
          </div>
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
