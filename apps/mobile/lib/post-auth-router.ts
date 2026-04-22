import { apiFetch } from './api';

/**
 * Given a user session/profile, deterministically resolve where they should route.
 */
export async function getPostAuthDestination(user: any): Promise<string> {
  try {
    const profile = await apiFetch<any>('/api/auth/profile', { method: 'POST' });
    
    // As per docs: club_staff -> dashboard, club_memberships only -> /portal, else -> interests/home
    if (profile.destination === '/clubs') return '/(dashboard)/clubs'; // 2+ clubs
    if (profile.clubSlug) return `/(dashboard)/${profile.clubSlug}/dashboard`;
    if (profile.destination === '/onboarding/interests') return '/onboarding/interests';
    
    return '/(tabs)/home';
  } catch (err) {
    // Fallback if the API fetch fails (which it might if mocked temporarily)
    // If onboarding is skipped/completed, go to discover
    if (user?.user_metadata?.onboarding_step === 'completed' || user?.user_metadata?.onboarding_step === 'interests_skipped') {
      return '/(tabs)/home';
    }
    // Default for fresh user:
    return '/onboarding/interests';
  }
}
