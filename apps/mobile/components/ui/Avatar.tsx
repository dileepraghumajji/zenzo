import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../lib/theme-context';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AvatarProps {
  /** Image URL — if null/undefined, shows initials */
  imageUrl?: string | null;
  /** Full name to extract initials from */
  name: string;
  /** Size in pixels */
  size?: number;
  style?: ViewStyle;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Avatar({ imageUrl, name, size = 40, style }: AvatarProps) {
  const { colors, typography } = useTheme();

  const initials = getInitials(name);
  const fontSize = size * 0.38;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceSubtle,
          },
          style,
        ]}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`${name}'s avatar`}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessibilityLabel={`${name}'s avatar`}
    >
      <Text
        style={{
          color: colors.textInverse,
          fontSize,
          fontWeight: typography.weight.semibold,
          // Prevent text from being cut off
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}
