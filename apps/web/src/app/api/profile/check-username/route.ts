import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RESERVED_USERNAMES } from "@zenzo/database/enums";

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const u = searchParams.get("u")?.toLowerCase() ?? "";

  if (!USERNAME_REGEX.test(u)) {
    return NextResponse.json({ available: false, reason: "invalid_format" });
  }

  if ((RESERVED_USERNAMES as readonly string[]).includes(u)) {
    return NextResponse.json({ available: false, reason: "reserved" });
  }

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("username", u)
    .neq("id", user.id)
    .maybeSingle();

  if (data) {
    return NextResponse.json({ available: false, reason: "taken" });
  }

  return NextResponse.json({ available: true });
}
