import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // For OAuth providers, check if profile is complete (phone required).
      // Email+password signup always collects phone upfront.
      const provider = data.user.app_metadata?.provider;
      if (provider && provider !== 'email') {
        const { data: profile } = await supabase
          .from("users")
          .select("phone")
          .eq("id", data.user.id)
          .single();

        if (!profile?.phone) {
          return NextResponse.redirect(`${origin}/complete-profile`);
        }
      }

      // Find all clubs this user is staff at
      const { data: staff } = await supabase
        .from("club_staff")
        .select("role, club_id")
        .eq("user_id", data.user.id);

      if (!staff || staff.length === 0) {
        // Check if this is a new user who hasn't done interest onboarding yet.
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_step")
          .eq("id", data.user.id)
          .single();
        if (!profile?.onboarding_step) {
          return NextResponse.redirect(`${origin}/onboarding/interests`);
        }
        return NextResponse.redirect(`${origin}/portal`);
      }

      if (staff.length === 1) {
        // get club slug
        const firstStaff = staff[0];
        if (firstStaff) {
          const { data: club } = await supabase
            .from("clubs")
            .select("slug")
            .eq("id", firstStaff.club_id)
            .single();

          if (club) {
            return NextResponse.redirect(`${origin}/${club.slug}/dashboard`);
          }
        }
      }

      return NextResponse.redirect(`${origin}/clubs`);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
