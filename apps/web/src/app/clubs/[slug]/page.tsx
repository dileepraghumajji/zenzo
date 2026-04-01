// /clubs/[slug] — public club listing page
// No auth required. Returns 404 if club is not verified.

import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Users, Clock, MessageCircle } from "lucide-react";
import { createServiceClient } from "@zenzo/database/client";
import { VerificationStatus, ClubCategory, BillingCycle, StaffRole } from "@zenzo/database/enums";
import { formatCurrency } from "@zenzo/utils";
import type { DayOfWeek } from "@zenzo/database";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  [ClubCategory.Gym]:         "Gym",
  [ClubCategory.MartialArts]: "Martial Arts",
  [ClubCategory.Dance]:       "Dance",
  [ClubCategory.Yoga]:        "Yoga",
  [ClubCategory.Other]:       "Other",
};

const BILLING_LABELS: Record<string, string> = {
  [BillingCycle.Monthly]:    "/ month",
  [BillingCycle.Quarterly]:  "/ quarter",
  [BillingCycle.HalfYearly]: "/ 6 months",
  [BillingCycle.Annual]:     "/ year",
  [BillingCycle.PerSession]: "/ session",
};

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed",
  thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

function formatDays(days: string[]): string {
  return days.map((d) => DAY_LABELS[d] ?? d).join(", ");
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  if (!h || !m) return time;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-3">
      <h2 className="text-h3 text-heading">{title}</h2>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicClubPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServiceClient();

  // Club
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, city, phone, business_type, description, verification_status")
    .eq("slug", params.slug)
    .single();

  if (!club || club.verification_status !== VerificationStatus.Verified) {
    notFound();
  }

  // Fee plans
  const { data: plans } = await supabase
    .from("fee_plans")
    .select("id, name, amount_paise, billing_cycle")
    .eq("club_id", club.id)
    .order("amount_paise", { ascending: true });

  // Batches
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, start_time, end_time, days")
    .eq("club_id", club.id)
    .order("name", { ascending: true });

  // Staff
  const { data: staff } = await supabase
    .from("club_staff")
    .select("id, role, user_id")
    .eq("club_id", club.id);

  const staffUserIds = (staff ?? []).map((s) => s.user_id);
  let staffUsers: { id: string; full_name: string }[] = [];
  if (staffUserIds.length > 0) {
    const { data } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", staffUserIds);
    staffUsers = data ?? [];
  }

  const coaches = (staff ?? [])
    .filter((s) => s.role === StaffRole.Coach)
    .map((s) => ({
      id:        s.id,
      full_name: staffUsers.find((u) => u.id === s.user_id)?.full_name ?? "Coach",
    }));

  return (
    <div className="min-h-screen bg-background">
      {/* Back to explore */}
      <div className="border-b border-border bg-surface-raised">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link href="/explore" className="text-caption text-muted hover:text-brand transition-colors">
            ← Back to Explore
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-h1 text-heading">{club.name}</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-primary-subtle text-brand">
              {CATEGORY_LABELS[club.business_type] ?? club.business_type}
            </span>
          </div>
          {club.city && (
            <div className="flex items-center gap-1.5 text-body text-muted">
              <MapPin className="size-4" />
              {club.city}
            </div>
          )}
        </div>

        {/* About */}
        {club.description && (
          <SectionCard title="About">
            <p className="text-body text-muted whitespace-pre-line">{club.description}</p>
          </SectionCard>
        )}

        {/* Plans & Pricing */}
        {plans && plans.length > 0 && (
          <SectionCard title="Plans & Pricing">
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-body text-heading">{plan.name}</span>
                  <span className="text-body font-semibold text-heading">
                    {formatCurrency(plan.amount_paise)}
                    <span className="text-caption text-muted font-normal ml-1">
                      {BILLING_LABELS[plan.billing_cycle] ?? ""}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Schedule */}
        {batches && batches.length > 0 && (
          <SectionCard title="Schedule">
            <div className="space-y-2">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <Clock className="size-4 text-muted mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-body font-medium text-heading">{batch.name}</p>
                    <p className="text-caption text-muted">
                      {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
                      {batch.days && (batch.days as DayOfWeek[]).length > 0 && (
                        <> · {formatDays(batch.days as string[])}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Coaches */}
        {coaches.length > 0 && (
          <SectionCard title="Coaches">
            <div className="flex flex-wrap gap-2">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-subtle border border-border"
                >
                  <div className="size-7 rounded-full bg-primary-subtle flex items-center justify-center">
                    <Users className="size-3.5 text-brand" />
                  </div>
                  <span className="text-body font-medium text-heading">{coach.full_name}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* CTA */}
        <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-h3 text-heading">Want to join?</h2>
          <p className="text-body text-muted">
            Membership is by invite from the club. Contact the club on WhatsApp to express interest.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {club.phone && (
              <a
                href={`https://wa.me/91${club.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#25D366] text-white font-medium text-body hover:bg-[#1fba5a] transition-colors"
              >
                <MessageCircle className="size-4" />
                WhatsApp the Club
              </a>
            )}
            <Link
              href="/portal/invites"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-subtle border border-border font-medium text-body text-heading hover:bg-surface-raised transition-colors"
            >
              Check My Invites
            </Link>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-body hover:bg-primary/90 transition-colors"
            >
              Sign up to Zenzo
            </Link>
          </div>
          {club.phone && (
            <div className="flex items-center gap-1.5 text-caption text-muted">
              <Phone className="size-3" />
              {club.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
