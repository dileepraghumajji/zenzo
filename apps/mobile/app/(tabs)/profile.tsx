import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../lib/theme-context';

export default function ProfileScreen() {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surfacePage, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg }}>Profile (Coming Soon)</Text>
    </View>
  );
}
