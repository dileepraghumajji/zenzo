import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme-context';
import { useAuth } from '../lib/auth-context';
import { Avatar } from './ui/Avatar';

export function TopBar() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || user?.email || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfacePage,
          // We add safe area padding top to ensure it sits below the status bar correctly.
          // On Android edge-to-edge, this is required. Platform.OS padding fallback is just in case.
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 16 : 0),
          paddingHorizontal: spacing.base,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderDefault,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: typography.weight.bold,
          color: colors.primary,
          letterSpacing: -0.5,
        }}
      >
        zenzo
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/profile')}
        accessibilityLabel="Go to Profile"
      >
        <Avatar name={fullName} imageUrl={avatarUrl} size={32} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // We add a tiny bit of zIndex/elevation so scrolling content goes neatly underneath if needed
    zIndex: 10,
  },
});
