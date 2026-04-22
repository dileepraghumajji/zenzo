import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme-context';
import { getPostAuthDestination } from '../lib/post-auth-router';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until router is fully mounted before attempting redirect
    if (!rootNavigationState?.key || loading) return;

    const navigateToDestination = async () => {
      if (!user) {
        router.replace('/(auth)/login');
      } else {
        try {
          const dest = await getPostAuthDestination(user);
          router.replace(dest as any);
        } catch {
          router.replace('/(tabs)/home'); // Fallback
        }
      }
    };

    navigateToDestination();
  }, [user, loading, rootNavigationState?.key]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfacePage }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
