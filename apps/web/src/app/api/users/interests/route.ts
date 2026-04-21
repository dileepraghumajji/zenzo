import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InterestSlug } from "@zenzo/database";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const slugs: string[] = body.slugs || [];
  const city: string | undefined = body.city;

  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json({ error: "At least one interest is required" }, { status: 400 });
  }

  const validSlugs = Object.values(InterestSlug);
  const invalidSlugs = slugs.filter((s) => !validSlugs.includes(s as any));
  if (invalidSlugs.length > 0) {
    return NextResponse.json({ error: "Invalid interests selected" }, { status: 400 });
  }

  // Idempotent upsert: delete existing, then insert new
  const { error: deleteError } = await supabase
    .from("user_interests")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to update interests" }, { status: 500 });
  }

  const interestsToInsert = slugs.map((slug) => ({
    user_id: user.id,
    slug: slug as (typeof InterestSlug)[keyof typeof InterestSlug],
  }));

  const { error: insertError } = await supabase
    .from("user_interests")
    .insert(interestsToInsert);

  if (insertError) {
    return NextResponse.json({ error: "Failed to save interests" }, { status: 500 });
  }

  // Update user profile
  const updatePayload: any = { onboarding_step: "interests_done" };
  if (city !== undefined) {
    updatePayload.city = city.trim() || null;
  }

  const { error: userUpdateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", user.id);

  if (userUpdateError) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
