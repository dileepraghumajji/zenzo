import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Skeleton, SkeletonCircle, SkeletonText } from '../ui/Skeleton';

export function ClubCardSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors, radii, spacing, isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceCard,
          borderRadius: radii.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderDefault,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <Skeleton width={48} height={48} borderRadius={radii.md} />

        <View style={{ flex: 1, marginLeft: spacing.md, gap: 4 }}>
          <SkeletonText width="80%" lines={1} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Skeleton width={60} height={12} />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
        <Skeleton width={80} height={20} borderRadius={radii.full} />
      </View>

      <View style={{ gap: 4 }}>
        <SkeletonText width="100%" lines={1} />
        <SkeletonText width="60%" lines={1} />
      </View>
    </View>
  );
}
