// ─── Settings Page ────────────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/settings
//
// Owner-only. Fetches club profile and renders the SettingsForm.

import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth";
import { StaffRole, ClubCategory } from "@zenzo/database/enums";
import { SettingsForm } from "./_components/settings-form";

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
    .select("id, name, city, phone, business_type")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-8">

      <div>
        <h1 className="text-[26px] font-bold text-foreground">Settings</h1>
        <p className="text-[13px] text-muted mt-0.5">
          Manage your club profile.
        </p>
      </div>

      {/* ── Business Profile ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-5">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">
            Business Profile
          </h2>
          <p className="text-[13px] text-muted mt-0.5">
            This information is shown on your club page.
          </p>
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

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-error/30 p-6 space-y-3">
        <h2 className="text-[15px] font-semibold text-foreground">
          Danger Zone
        </h2>
        <p className="text-[13px] text-muted">
          Destructive actions like deleting the club are not available in this
          early version. Contact Zenzo support if needed.
        </p>
      </section>
    </div>
  );
}
