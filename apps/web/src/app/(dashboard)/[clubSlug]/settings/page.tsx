// ─── Settings Page ────────────────────────────────────────────────────────────
//
// Layer 3: Server Component — owner-only.
// Sections: Business Profile | Logo | Customization | Notifications | Danger Zone

import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth";
import { StaffRole, ClubCategory } from "@zenzo/database/enums";
import { SettingsForm }         from "./_components/settings-form";
import { LogoUpload }           from "./_components/logo-upload";
import { CustomizationForm }    from "./_components/customization-form";
import { NotificationToggles }  from "./_components/notification-toggles";

export const metadata = { title: "Settings" };

interface Props {
  params: { clubSlug: string };
}

export default async function SettingsPage({ params }: Props) {
  const { clubSlug } = params;

  const { role } = await getUserProfile(clubSlug);
  if (role !== StaffRole.Owner) redirect(`/${clubSlug}/dashboard`);

  const supabase = createSupabaseServerClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, city, phone, business_type, logo_url, terminology")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // Parse terminology JSON safely
  const terminology = (club.terminology ?? {}) as Record<string, unknown>;
  const memberLabel        = typeof terminology.member_label         === "string"  ? terminology.member_label         : "Member";
  const progressionEnabled = typeof terminology.progression_enabled  === "boolean" ? terminology.progression_enabled  : true;
  const billingCycleType   = terminology.billing_cycle_type === "calendar"         ? "calendar" as const              : "doj" as const;
  const notifPayment       = terminology.notif_payment_reminder    !== false;
  const notifAttendance    = terminology.notif_attendance_alert     !== false;
  const notifWelcome       = terminology.notif_welcome_message      !== false;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-8">

      <div>
        <h1 className="text-[26px] font-bold text-foreground">Settings</h1>
        <p className="text-[13px] text-muted mt-0.5">
          Manage your club profile and preferences.
        </p>
      </div>

      {/* ── Business Profile ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-5">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Business Profile</h2>
          <p className="text-[13px] text-muted mt-0.5">Shown on your public club page.</p>
        </div>
        <SettingsForm
          clubSlug={clubSlug}
          profile={{
            name:         club.name,
            city:         club.city,
            phone:        club.phone,
            businessType: club.business_type as ClubCategory,
          }}
        />
      </section>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-5">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Club Logo</h2>
          <p className="text-[13px] text-muted mt-0.5">Shown on your public page and member receipts.</p>
        </div>
        <LogoUpload clubSlug={clubSlug} currentLogoUrl={club.logo_url} />
      </section>

      {/* ── Customization ────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-5">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Customization</h2>
          <p className="text-[13px] text-muted mt-0.5">Adjust terminology and feature visibility.</p>
        </div>
        <CustomizationForm
          clubSlug={clubSlug}
          memberLabel={memberLabel}
          progressionEnabled={progressionEnabled}
          billingCycleType={billingCycleType}
        />
      </section>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-5">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Notifications</h2>
          <p className="text-[13px] text-muted mt-0.5">Choose which automated messages to send to members.</p>
        </div>
        <NotificationToggles
          clubSlug={clubSlug}
          paymentReminder={notifPayment}
          attendanceAlert={notifAttendance}
          welcomeMessage={notifWelcome}
        />
      </section>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-error/30 p-6 space-y-3">
        <h2 className="text-[15px] font-semibold text-foreground">Danger Zone</h2>
        <p className="text-[13px] text-muted">
          Destructive actions like deleting the club are not available in this
          early version. Contact Zenzo support if needed.
        </p>
      </section>
    </div>
  );
}
