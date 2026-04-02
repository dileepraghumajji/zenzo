import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const [attendanceResult, clubsResult] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .gte("date", sevenDaysAgoStr),
      supabase
        .from("clubs")
        .select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      weeklyAttendance: attendanceResult.count ?? 0,
      activeClubs: clubsResult.count ?? 0,
    });
  } catch {
    return NextResponse.json({ weeklyAttendance: 0, activeClubs: 0 });
  }
}
