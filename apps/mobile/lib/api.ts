import { supabase } from './supabase';

import Constants from 'expo-constants';

const DEV_IP = Constants.expoConfig?.hostUri?.split(':')[0];
const API_BASE_URL = __DEV__ && DEV_IP 
  ? `http://${DEV_IP}:3000` 
  : (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://zenzo.club');

/**
 * Typed fetch wrapper that injects the Supabase auth token.
 * All mobile API calls go through this — same endpoints as the web app.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed: ${res.status}`);
  }

  return res.json();
}
