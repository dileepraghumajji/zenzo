import { Suspense } from "react";
import type { Metadata } from "next";
import ExploreClient from "./_components/explore-client";

export const metadata: Metadata = {
  title: "Explore — Zenzo",
  description: "Find gyms, yoga studios, martial arts academies, and dance classes near you.",
};

export default function ExplorePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <Suspense>
        <ExploreClient />
      </Suspense>
    </div>
  );
}
