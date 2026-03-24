// ─── Zenzo Database Enums ─────────────────────────────────────────────────────
// Single source of truth for all enum values used across the database schema.
// Keep in sync with the SQL enums defined in the migration files.
//
// Usage:
//   import { UserRole, MemberStatus } from "@zenzo/database/enums";
//   if (profile.role === UserRole.Owner) { ... }

export const UserRole = {
  Owner:  "owner",
  Staff:  "staff",
  Member: "member",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MemberStatus = {
  Active:    "active",
  Inactive:  "inactive",
  Suspended: "suspended",
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const AttendanceStatus = {
  Present:   "present",
  Absent:    "absent",
  Unmarked:  "unmarked",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const SessionType = {
  Group:     "group",
  OneOnOne:  "one_on_one",
} as const;
export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const DayOfWeek = {
  Mon: "mon", Tue: "tue", Wed: "wed",
  Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun",
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export const TenantPlan = {
  Trial:   "trial",
  Starter: "starter",
  Growth:  "growth",
  Pro:     "pro",
} as const;
export type TenantPlan = (typeof TenantPlan)[keyof typeof TenantPlan];
