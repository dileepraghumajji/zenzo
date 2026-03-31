// ─── Staff Page ───────────────────────────────────────────────────────────────
//
// Layer 3: Server Component
// Route: /:clubSlug/staff
//
// Owner-only. Lists all staff (owners + coaches) for this club.

import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth";
import { StaffRole } from "@zenzo/database/enums";
import { StaffClient } from "./_components/staff-client";

export const metadata = { title: "Staff" };

interface Props {
  params: { clubSlug: string };
}

export default async function StaffPage({ params }: Props) {
  const { clubSlug } = params;

  const { role, userId } = await getUserProfile(clubSlug);
  if (role !== StaffRole.Owner) redirect(`/${clubSlug}/dashboard`);

  const supabase = createSupabaseServerClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  const { data: staffRows } = await supabase
    .from("club_staff")
    .select("id, role, user_id, users(full_name, phone, email)")
    .eq("club_id", club.id);

  const staff = (staffRows ?? []).map((s) => ({
    staffId:  s.id,
    userId:   s.user_id,
    fullName: s.users?.full_name ?? "Unknown",
    phone:    s.users?.phone ?? "",
    email:    s.users?.email ?? null,
    role:     s.role as StaffRole,
  }));

  // Owner always first, then coaches sorted by name
  staff.sort((a, b) => {
    if (a.role === StaffRole.Owner) return -1;
    if (b.role === StaffRole.Owner) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <StaffClient
        clubSlug={clubSlug}
        currentUserId={userId}
        staff={staff}
      />
    </div>
  );
}
