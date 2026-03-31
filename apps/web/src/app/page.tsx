import { LandingHero } from "./_components/marketing/landing-hero";
import { FeatureSections } from "./_components/marketing/features";
import { DarkFooter } from "./_components/marketing/footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-default)] bg-[var(--surface-page)]/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--action-primary-bg)] flex items-center justify-center">
              <div className="h-3 w-3 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-[var(--text-primary)]">ZENZO</span>
          </div>

          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--action-primary-bg)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--action-primary-bg-hover)]"
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <LandingHero />
        <FeatureSections />
      </main>

      <DarkFooter />
    </div>
  );
}
