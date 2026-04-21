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
  Cash:     "cash",
  UPI:      "upi",
  Bank:     "bank",
  Razorpay: "razorpay",
  Other:    "other",
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

export const InterestSlug = {
  MartialArts: "martial_arts",
  Fitness:     "fitness",
  Dance:       "dance",
  Yoga:        "yoga",
  Boxing:      "boxing",
  Swimming:    "swimming",
  Crossfit:    "crossfit",
  Other:       "other",
} as const;
export type InterestSlug = (typeof InterestSlug)[keyof typeof InterestSlug];

export const INTEREST_CATEGORIES = [
  { slug: InterestSlug.MartialArts, label: "Martial Arts", icon: "🥋", color: "text-red-500 bg-red-500/10" },
  { slug: InterestSlug.Fitness, label: "Fitness", icon: "🏋️", color: "text-blue-500 bg-blue-500/10" },
  { slug: InterestSlug.Dance, label: "Dance", icon: "💃", color: "text-pink-500 bg-pink-500/10" },
  { slug: InterestSlug.Yoga, label: "Yoga", icon: "🧘", color: "text-emerald-500 bg-emerald-500/10" },
  { slug: InterestSlug.Boxing, label: "Boxing", icon: "🥊", color: "text-orange-500 bg-orange-500/10" },
  { slug: InterestSlug.Swimming, label: "Swimming", icon: "🏊", color: "text-cyan-500 bg-cyan-500/10" },
  { slug: InterestSlug.Crossfit, label: "CrossFit", icon: "💪", color: "text-stone-500 bg-stone-500/10" },
  { slug: InterestSlug.Other, label: "Other", icon: "🎯", color: "text-purple-500 bg-purple-500/10" },
] as const;

export const RESERVED_USERNAMES = [
  "admin", "zenzo", "support", "api", "portal", "discover", "search", "profile", "settings", "help", "about"
] as const;

export const ACHIEVEMENT_TEMPLATES = [
  { slug: "100_classes",       title: "100 Classes",       icon: "💯", description: "Attended 100 classes" },
  { slug: "1_year_member",     title: "1 Year Member",     icon: "🎂", description: "Been a member for 1 year" },
  { slug: "blue_belt",         title: "Blue Belt",         icon: "🥋", description: "Promoted to Blue Belt" },
  { slug: "top_performer",     title: "Top Performer",     icon: "🏆", description: "Outstanding performance this month" },
  { slug: "first_class",       title: "First Class",       icon: "⭐", description: "Attended their first class" },
  { slug: "iron_will",         title: "Iron Will",         icon: "🔥", description: "Showed exceptional determination" },
  { slug: "rising_star",       title: "Rising Star",       icon: "🌟", description: "Rapid skill improvement" },
  { slug: "team_player",       title: "Team Player",       icon: "🤝", description: "Great team spirit and support" },
  { slug: "perfect_week",      title: "Perfect Week",      icon: "✅", description: "Attended all sessions in a week" },
  { slug: "marathon_month",    title: "Marathon Month",    icon: "📅", description: "Attended 20+ sessions in a month" },
  { slug: "consistency_king",  title: "Consistency King",  icon: "👑", description: "3 months of consistent attendance" },
  { slug: "custom",            title: "Custom",            icon: "🎯", description: "" },
] as const;
