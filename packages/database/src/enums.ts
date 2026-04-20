// ─── Zenzo Database Enums ─────────────────────────────────────────────────────
// Single source of truth for all enum values used across the database schema.
// Keep in sync with the SQL enums defined in the migration files.
//
// Usage:
//   import { StaffRole, MembershipStatus } from "@zenzo/database/enums";
//   if (profile.role === StaffRole.Owner) { ... }

export const StaffRole = {
  Owner: "owner",
  Coach: "coach",
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const MembershipStatus = {
  PendingInvite: "pending_invite",
  Active:        "active",
  Overdue:       "overdue",
  Expired:       "expired",
  Deleted:       "deleted",
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const BillingCycle = {
  Monthly:    "monthly",
  Quarterly:  "quarterly",
  HalfYearly: "half_yearly",
  Annual:     "annual",
  PerSession:  "per_session",
} as const;
export type BillingCycle = (typeof BillingCycle)[keyof typeof BillingCycle];

export const PaymentMethod = {
  Cash:  "cash",
  UPI:   "upi",
  Bank:  "bank",
  Other: "other",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ClubCategory = {
  Gym:         "gym",
  MartialArts: "martial_arts",
  Dance:       "dance",
  Yoga:        "yoga",
  Other:       "other",
} as const;
export type ClubCategory = (typeof ClubCategory)[keyof typeof ClubCategory];

export const VerificationStatus = {
  Pending:  "pending",
  Verified: "verified",
  Rejected: "rejected",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const DayOfWeek = {
  Mon: "mon", Tue: "tue", Wed: "wed",
  Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun",
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export const AttendanceStatus = {
  Present:  "present",
  Absent:   "absent",
  Unmarked: "unmarked",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const InviteStatus = {
  Pending:  "pending",
  Accepted: "accepted",
  Expired:  "expired",
} as const;
export type InviteStatus = (typeof InviteStatus)[keyof typeof InviteStatus];
