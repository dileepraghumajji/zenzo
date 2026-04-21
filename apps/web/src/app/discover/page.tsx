import { Suspense } from "react";
import { DiscoverClubs, DiscoverSkeleton } from "./_components/discover-clubs";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <DiscoverClubs />
    </Suspense>
  );
}
