import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RESERVED_USERNAMES } from "@zenzo/database/enums";

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

// GET /api/profile — Returns the authenticated user's profile including interests
export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileRes, interestsRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, phone, email, bio, username, avatar_url, city, onboarding_step")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_interests")
      .select("slug")
      .eq("user_id", user.id),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...profileRes.data,
    interests: (interestsRes.data ?? []).map((r) => r.slug),
  });
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    full_name?: string;
    phone?: string;
    bio?: string;
    username?: string;
    avatar_url?: string;
    city?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { full_name, phone, bio, username, avatar_url, city } = body;

  if (bio !== undefined && bio !== null && bio.length > 160) {
    return NextResponse.json({ error: "Bio must be 160 characters or fewer" }, { status: 422 });
  }

  if (username !== undefined && username !== null) {
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({ error: "invalid_format", field: "username" }, { status: 422 });
    }
    if ((RESERVED_USERNAMES as readonly string[]).includes(username)) {
      return NextResponse.json({ error: "reserved", field: "username" }, { status: 422 });
    }
  }

  const updatePayload: Record<string, string | null | undefined> = {};
  if (full_name !== undefined) updatePayload.full_name = full_name;
  if (phone !== undefined) updatePayload.phone = phone;
  if (bio !== undefined) updatePayload.bio = bio || null;
  if (username !== undefined) updatePayload.username = username;
  if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url || null;
  if (city !== undefined) updatePayload.city = city || null;

  const { data, error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", user.id)
    .select("id, full_name, phone, email, bio, username, avatar_url, city, onboarding_step")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "username_taken", field: "username" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
