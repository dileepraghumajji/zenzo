import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "./_components/profile-form";

function ProfileSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-surface-raised rounded-lg" />
        <div className="h-4 w-56 bg-surface-raised rounded" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="size-20 rounded-full bg-surface-raised" />
        <div className="h-3 w-24 bg-surface-raised rounded" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 bg-surface-raised rounded" />
            <div className="h-10 bg-surface-raised rounded-lg" />
          </div>
        ))}
      </div>
      <div className="h-12 bg-surface-raised rounded-lg" />
    </div>
  );
}

async function ProfileLoader() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: interests }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, phone, email, bio, username, avatar_url, city")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_interests")
      .select("slug")
      .eq("user_id", user.id),
  ]);

  if (!profile) redirect("/login");

  return (
    <ProfileForm
      profile={{
        ...profile,
        phone: profile.phone ?? "",
        interests: (interests ?? []).map((i) => i.slug),
      }}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileLoader />
    </Suspense>
  );
}
