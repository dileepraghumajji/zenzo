// ─── QR Token Utility ─────────────────────────────────────────────────────────
//
// Creates and verifies HMAC-SHA256 signed tokens for QR code attendance.
//
// Token format: `{base64url_payload}.{base64url_signature}`
// Payload: JSON { batchId, date, exp }
//   - date: YYYY-MM-DD (IST midnight)
//   - exp: Unix ms timestamp (end of the calendar day, 23:59:59.999 UTC)
//
// Security:
//   - Signature prevents forgery
//   - exp prevents replay across days
//   - timingSafeEqual prevents timing attacks

import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET ?? "zenzo-qr-dev-secret";

export interface QRPayload {
  batchId: string;
  date: string;   // YYYY-MM-DD
  exp: number;    // Unix ms
}

function buildPayload(batchId: string, date: string): string {
  // Token expires at end of that calendar day (23:59:59.999 UTC)
  const exp = new Date(`${date}T23:59:59.999Z`).getTime();
  const raw = JSON.stringify({ batchId, date, exp } satisfies QRPayload);
  return Buffer.from(raw).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", QR_SECRET).update(payload).digest("base64url");
}

export function createQRToken(batchId: string, date: string): string {
  const payload = buildPayload(batchId, date);
  return `${payload}.${sign(payload)}`;
}

export function verifyQRToken(token: string): QRPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig     = token.slice(dot + 1);

  const expectedSig = sign(payload);

  // Constant-time comparison (both buffers are 32-byte HMAC outputs → equal length)
  const sigBuf      = Buffer.from(sig, "base64url");
  const expectedBuf = Buffer.from(expectedSig, "base64url");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as QRPayload;
    if (Date.now() > data.exp) return null; // Expired
    if (!data.batchId || !data.date) return null;
    return data;
  } catch {
    return null;
  }
}
