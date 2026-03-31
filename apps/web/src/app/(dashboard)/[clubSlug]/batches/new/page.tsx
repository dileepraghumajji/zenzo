// ─── Create Batch Page ───────────────────────────────────────────────────────
//
// Layer 3: Server Component — pre-fetches coaches (club_staff users) then
// renders the client form.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateBatchForm } from "./_components/create-batch-form";
import { StaffRole } from "@zenzo/database/enums";

export const metadata = { title: "Create Batch" };

interface Props {
  params: { clubSlug: string };
}

export default async function CreateBatchPage({ params }: Props) {
  const { clubSlug } = params;
  const supabase = createSupabaseServerClient();

  // Resolve club id
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) notFound();

  // Fetch staff (coaches + owner) to populate Coach select
  const { data: staffRows } = await supabase
    .from("club_staff")
    .select("user_id, role")
    .eq("club_id", club.id);

  const staffUserIds = (staffRows ?? []).map((s) => s.user_id);

  let coaches: { id: string; full_name: string; role: StaffRole }[] = [];

  if (staffUserIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", staffUserIds);

    const roleMap = new Map((staffRows ?? []).map((s) => [s.user_id, s.role]));

    coaches = (users ?? []).map((u) => ({
      id:        u.id,
      full_name: u.full_name,
      role:      roleMap.get(u.id) ?? StaffRole.Coach,
    }));
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-xl mx-auto">

      {/* Back link */}
      <Link
        href={`/${clubSlug}/batches`}
        className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Batches
      </Link>

      <h1 className="text-[24px] font-bold text-foreground leading-tight mb-8">
        Create Batch
      </h1>

      <CreateBatchForm clubSlug={clubSlug} coaches={coaches} />

    </div>
  );
}
