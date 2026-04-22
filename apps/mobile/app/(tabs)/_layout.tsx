import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Feather } from '@expo/vector-icons';
import { TopBar } from '../../components/TopBar';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 56 : 60;

  return (
    <Tabs
      screenOptions={{
        header: () => <TopBar />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surfacePage,
          borderTopColor: colors.borderDefault,
          // Total height = base height + safe area inset
          height: TAB_BAR_HEIGHT + insets.bottom,
          // Pad the bottom to bump icons/text above the system navigation bar
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontWeight: typography.weight.medium,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Feather name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
