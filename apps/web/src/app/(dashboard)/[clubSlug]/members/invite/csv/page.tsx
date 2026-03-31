// ─── Bulk CSV Invite Page ─────────────────────────────────────────────────────
//
// Layer 3: Server Component — pre-fetches batches + plans, passes to client.

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CsvInviteForm } from "./_components/csv-invite-form";

export const metadata = { title: "Bulk Invite via CSV" };

interface Props {
  params: { clubSlug: string };
}

export default async function CsvInvitePage({ params }: Props) {
  const { clubSlug } = params;
  const supabase = createSupabaseServerClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

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
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <Link
        href={`/${clubSlug}/members`}
        className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Members
      </Link>

      <h1 className="text-[24px] font-bold text-foreground leading-tight mb-2">
        Bulk Invite via CSV
      </h1>
      <p className="text-[14px] text-muted mb-8">
        Paste or upload a CSV with columns: <code className="font-mono bg-surface-subtle px-1 rounded">name, phone, email</code>. One member per row.
      </p>

      <CsvInviteForm
        clubSlug={clubSlug}
        batches={batches ?? []}
        plans={plans ?? []}
      />
    </div>
  );
}
