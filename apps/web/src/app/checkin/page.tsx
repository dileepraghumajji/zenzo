// ─── Check-In Page ────────────────────────────────────────────────────────────
//
// Public page — no login required.
// Members land here after scanning a batch QR code.
//
// URL: /checkin?b={batchId}&t={token}
//
// Server side:
//   1. Reads + verifies the token (signature + expiry)
//   2. Fetches batch name from DB
//   3. Renders CheckInClient with pre-validated data
//   4. Shows a static error page for invalid/expired tokens (no client needed)

import { verifyQRToken } from "@/lib/qr-token";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CheckInClient } from "./_components/checkin-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Check In" };

interface Props {
  searchParams: { b?: string; t?: string };
}

export default async function CheckInPage({ searchParams }: Props) {
  const rawToken = searchParams.t;
  const batchId  = searchParams.b;

  // ── Validate token ───────────────────────────────────────────────────────
  if (!rawToken || !batchId) {
    return <ErrorScreen message="Invalid check-in link." />;
  }

  const token = decodeURIComponent(rawToken);
  const payload = verifyQRToken(token);

  if (!payload) {
    return (
      <ErrorScreen message="This QR code has expired. Ask your coach to show a fresh one." />
    );
  }

  if (payload.batchId !== batchId) {
    return <ErrorScreen message="Invalid check-in link." />;
  }

  // ── Fetch batch name ─────────────────────────────────────────────────────
  // admin: RLS bypassed — public page, token already verified above
  const supabase = createSupabaseAdminClient();
  const { data: batch } = await supabase
    .from("batches")
    .select("id, name")
    .eq("id", batchId)
    .single();

  if (!batch) {
    return <ErrorScreen message="Batch not found." />;
  }

  return (
    <Shell>
      <CheckInClient
        batchId={batchId}
        batchName={batch.name}
        token={token}
        date={payload.date}
      />
    </Shell>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Top bar */}
      <header className="px-5 py-4 border-b border-border">
        <span className="text-[16px] font-bold text-foreground tracking-tight">
          Zenzo
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

// ─── ErrorScreen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <Shell>
      <div className="text-center space-y-3">
        <div className="mx-auto size-14 rounded-full bg-error-subtle flex items-center justify-center">
          <span className="text-[24px]">✗</span>
        </div>
        <p className="text-[15px] text-foreground font-medium">{message}</p>
        <p className="text-[13px] text-muted">
          Contact your coach or club staff for help.
        </p>
      </div>
    </Shell>
  );
}
