// /explore — public club discovery page
// No auth required. All filtering + pagination handled client-side via ExploreClient.

import { Suspense } from "react";
import ExploreClient from "./_components/explore-client";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero header */}
      <div className="bg-surface-raised border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-h1 text-heading">Explore Clubs</h1>
          <p className="text-body text-muted mt-1">
            Find the perfect gym, dance studio, or martial arts club near you.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <Suspense>
          <ExploreClient />
        </Suspense>
      </div>
    </div>
  );
}
