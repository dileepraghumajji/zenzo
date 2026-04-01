// validators.ts
// Phone normalization, UUID detection, and slug validation.
// Duplicated across 10+ API routes — import from here instead.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Slug: lowercase letters, numbers, hyphens; 1–50 chars; no leading/trailing hyphen
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$|^[a-z0-9]$/;

/**
 * Strip all non-digit characters, then check for exactly 10 digits.
 * Accepts inputs like "98765 43210" or "+91-98765-43210".
 */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "").replace(/^91/, "");
}

/** Returns true if the normalised phone is exactly 10 digits. */
export function isValidPhone(input: string): boolean {
  return /^\d{10}$/.test(normalizePhone(input));
}

/** Returns true if the string is a valid UUID v4 (or any hex UUID). */
export function isUUID(str: string): boolean {
  return UUID_RE.test(str);
}

/** Returns true if the string is a valid club/user slug. */
export function isValidSlug(str: string): boolean {
  return SLUG_RE.test(str);
}
