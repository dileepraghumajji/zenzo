// /portal/[clubSlug]/payments/[paymentId] — Receipt detail
//
// Server Component: fetches payment + membership + club details.
// Shows a clean receipt view. [Download PDF] is deferred to Phase 2.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@zenzo/utils";

interface Props {
  params: { clubSlug: string; paymentId: string };
}

export async function generateMetadata() {
  return { title: "Payment Receipt" };
}

export default async function ReceiptPage({ params }: Props) {
  const { clubSlug, paymentId } = params;
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // ── Resolve club ────────────────────────────────────────────────────────────
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  // ── Verify user has a membership in this club ───────────────────────────────
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("id, plan_id, user_id")
    .eq("user_id", user.id)
    .eq("club_id", club.id)
    .is("deleted_at", null)
    .limit(1)
    .single();

  if (!membership) notFound();

  // ── Fetch the payment (scoped to this membership) ───────────────────────────
  const { data: payment } = await supabase
    .from("payments")
    .select("id, amount_paise, method, payment_date, reference, note, recorded_by")
    .eq("id", paymentId)
    .eq("membership_id", membership.id)
    .single();

  if (!payment) notFound();

  // ── Fee plan name ───────────────────────────────────────────────────────────
  const { data: feePlan } = membership.plan_id
    ? await supabase
        .from("fee_plans")
        .select("name, billing_cycle")
        .eq("id", membership.plan_id)
        .single()
    : { data: null };

  // ── Fetcher name ────────────────────────────────────────────────────────────
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const methodLabel = payment.method.replace(/_/g, " ");

  return (
    <div className="max-w-portal mx-auto px-4 py-8 space-y-6">
      {/* Back nav */}
      <Link
        href={`/portal/${clubSlug}`}
        className="inline-flex items-center gap-2 text-caption text-muted hover:text-heading transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to {club.name}
      </Link>

      {/* Receipt card */}
      <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-success px-6 py-8 text-center">
          <CheckCircle2 className="size-10 text-success-foreground mx-auto mb-3" />
          <p className="text-h2 font-bold text-success-foreground">Payment Recorded</p>
          <p className="text-h1 font-extrabold text-heading mt-1">
            {formatCurrency(payment.amount_paise)}
          </p>
        </div>

        {/* Details */}
        <div className="divide-y divide-border">
          <ReceiptRow label="Club" value={club.name} />
          <ReceiptRow label="Member" value={userProfile?.full_name ?? "—"} />
          <ReceiptRow label="Date" value={formatDate(payment.payment_date)} />
          <ReceiptRow label="Method" value={methodLabel} />
          {feePlan && <ReceiptRow label="Plan" value={feePlan.name} />}
          {payment.reference && (
            <ReceiptRow label="Reference" value={payment.reference} />
          )}
          {payment.note && <ReceiptRow label="Note" value={payment.note} />}
        </div>
      </div>

      {/* Download stub */}
      <p className="text-center text-caption text-muted">
        PDF receipts coming in a future update
      </p>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-caption text-muted">{label}</span>
      <span className="text-body font-medium text-heading text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
