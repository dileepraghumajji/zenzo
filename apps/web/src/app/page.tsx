import dynamic from "next/dynamic";
import { LandingHero } from "./_components/marketing/landing-hero";
import { DarkFooter } from "./_components/marketing/footer";
import { NavBar } from "./_components/marketing/navbar";
import { InteractiveDemo } from "./_components/marketing/interactive-demo";

// Code-split the heavy sticky-scroll + bento section
const FeatureSections = dynamic(
  () => import("./_components/marketing/features").then((m) => ({ default: m.FeatureSections })),
);

function formatCount(n: number): string {
  if (n === 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
  return `${n}+`;
}

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
        <LandingHero />

        {/* Social Proof Bar */}
        <div className="border-y border-[var(--border-default)] bg-[var(--surface-subtle)] py-6">
          <div className="container mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
              <div>
                <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {formatCount(stats.activeClubs)}
                </p>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                  Clubs active
                </p>
              </div>
              <div className="hidden sm:block h-8 w-px bg-[var(--border-default)]" />
              <div>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {formatCount(stats.weeklyAttendance)}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--status-success-text)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)] animate-pulse" />
                    live
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                  Attendance marks this week
                </p>
              </div>
              <div className="hidden sm:block h-8 w-px bg-[var(--border-default)]" />
              <div className="flex items-center gap-2">
                <span className="text-lg">🇮🇳</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Built in India, for India</p>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">₹ native · WhatsApp-first</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FeatureSections />
        <InteractiveDemo />
      </main>

      <DarkFooter />
    </div>
  );
}
