// ─── Invite Member Page ────────────────────────────────────────────────────────
//
// Layer 3: Server Component — pre-fetches batches + fee plans, passes to client.
// Thin shell; all interactivity lives in InviteForm.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteForm } from "./_components/invite-form";

export const metadata = { title: "Add Member" };

interface Props {
  params: { clubSlug: string };
}

export default async function InviteMemberPage({ params }: Props) {
  const { clubSlug } = params;
  const supabase = createSupabaseServerClient();

  // Resolve club id
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (clubError || !club) notFound();

  // Fetch batches and fee plans in parallel
  const [{ data: batches }, { data: plans }] = await Promise.all([
    supabase
      .from("batches")
      .select("id, name")
      .eq("club_id", club.id)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("fee_plans")
      .select("id, name, amount_paise")
      .eq("club_id", club.id)
      .order("amount_paise"),
  ]);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-xl mx-auto">

      {/* Back link */}
      <Link
        href={`/${clubSlug}/members`}
        className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Members
      </Link>

      <h1 className="text-[24px] font-bold text-foreground leading-tight mb-8">
        Add Member
      </h1>

      <InviteForm
        clubSlug={clubSlug}
        batches={batches ?? []}
        plans={plans ?? []}
      />

    </div>
  );
}
