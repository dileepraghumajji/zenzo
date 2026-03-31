// GET /api/clubs/explore — public endpoint
// Returns verified + listed clubs with optional filters: city, category, q (name search)
// Paginated: 20 per page via ?page=N

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClubCategory, VerificationStatus } from "@zenzo/database/enums";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city     = searchParams.get("city")?.trim() || null;
  const category = searchParams.get("category")?.trim() || null;
  const q        = searchParams.get("q")?.trim() || null;
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const from     = (page - 1) * PAGE_SIZE;
  const to       = from + PAGE_SIZE - 1;

  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("clubs")
    .select("id, name, slug, city, business_type, description", { count: "exact" })
    .eq("verification_status", VerificationStatus.Verified)
    .eq("listed", true)
    .range(from, to)
    .order("name", { ascending: true });

  if (city)     query = query.ilike("city", `%${city}%`);
  if (category) query = query.eq("business_type", category as ClubCategory);
  if (q)        query = query.ilike("name", `%${q}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    clubs: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}
