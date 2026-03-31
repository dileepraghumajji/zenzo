// GET /api/portal/invites
//
// Returns all pending, non-expired club_invites for the current user's email.
// Joins clubs (name), users (invited_by name), fee_plans (name), batches (name).
//
// Returns: { invites: Invite[] }

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Get the user's email from the users table
  const { data: userRow } = await admin
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!userRow) {
    return NextResponse.json({ invites: [] });
  }

  const now = new Date().toISOString();

  const { data: invites, error } = await admin
    .from("club_invites")
    .select("id, token, club_id, plan_id, batch_id, invited_by, expires_at")
    .eq("email", userRow.email)
    .eq("status", "pending")
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (error || !invites) {
    return NextResponse.json({ invites: [] });
  }

  if (invites.length === 0) {
    return NextResponse.json({ invites: [] });
  }

  // Batch-fetch related data
  const clubIds      = [...new Set(invites.map((i) => i.club_id))];
  const planIds      = [...new Set(invites.map((i) => i.plan_id).filter(Boolean))] as string[];
  const batchIds     = [...new Set(invites.map((i) => i.batch_id).filter(Boolean))] as string[];
  const inviterIds   = [...new Set(invites.map((i) => i.invited_by).filter(Boolean))] as string[];

  const [clubsRes, plansRes, batchesRes, invitersRes] = await Promise.all([
    admin.from("clubs").select("id, name").in("id", clubIds),
    planIds.length > 0
      ? admin.from("fee_plans").select("id, name").in("id", planIds)
      : Promise.resolve({ data: [] }),
    batchIds.length > 0
      ? admin.from("batches").select("id, name").in("id", batchIds)
      : Promise.resolve({ data: [] }),
    inviterIds.length > 0
      ? admin.from("users").select("id, full_name").in("id", inviterIds)
      : Promise.resolve({ data: [] }),
  ]);

  const clubMap    = new Map((clubsRes.data    ?? []).map((c) => [c.id, c.name]));
  const planMap    = new Map((plansRes.data    ?? []).map((p) => [p.id, p.name]));
  const batchMap   = new Map((batchesRes.data  ?? []).map((b) => [b.id, b.name]));
  const inviterMap = new Map((invitersRes.data ?? []).map((u) => [u.id, u.full_name]));

  const result = invites.map((inv) => ({
    id:              inv.id,
    token:           inv.token,
    club_name:       clubMap.get(inv.club_id) ?? "Unknown Club",
    invited_by_name: inv.invited_by ? (inviterMap.get(inv.invited_by) ?? null) : null,
    plan_name:       inv.plan_id   ? (planMap.get(inv.plan_id)   ?? null) : null,
    batch_name:      inv.batch_id  ? (batchMap.get(inv.batch_id) ?? null) : null,
    expires_at:      inv.expires_at,
  }));

  return NextResponse.json({ invites: result });
}
