import { DarkFooter } from "./_components/marketing/footer";
import { NavBar } from "./_components/marketing/navbar";
import { InteractiveDemo } from "./_components/marketing/interactive-demo";
import { MarketingContent } from "./_components/marketing/marketing-content";

async function getMarketingStats() {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [attendanceResult, clubsResult] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .gte("date", sevenDaysAgo.toISOString().split("T")[0]),
      supabase.from("clubs").select("id", { count: "exact", head: true }),
    ]);

    return {
      weeklyAttendance: attendanceResult.count ?? 0,
      activeClubs: clubsResult.count ?? 0,
    };
  } catch {
    return { weeklyAttendance: 0, activeClubs: 0 };
  }
}

export default async function HomePage() {
  const stats = await getMarketingStats();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <NavBar />

      <main className="flex-1">
        <MarketingContent stats={stats} />
        <InteractiveDemo />
      </main>

      <DarkFooter />
    </div>
  );
}
