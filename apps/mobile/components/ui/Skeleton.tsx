import React, { useEffect, useRef } from 'react';
import { View, Animated, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme-context';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SkeletonProps {
  /** Width — number (px) or string ('100%') */
  width: number | string;
  /** Height in px */
  height: number;
  /** Border radius — defaults to theme radii.md */
  borderRadius?: number;
  /** Custom style overrides */
  style?: ViewStyle;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const { colors, radii } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? radii.md,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Prebuilt Skeletons ─────────────────────────────────────────────────────

/** Text line skeleton — matches a single line of body text */
export function SkeletonText({
  width = '100%',
  lines = 1,
}: {
  width?: number | string;
  lines?: number;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? '60%' : width}
          height={14}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

/** Circle skeleton — for avatar placeholders */
export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}
