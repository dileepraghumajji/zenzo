import React from 'react';
import { View, TouchableOpacity, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme-context';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** Remove padding — for full-bleed content like images */
  noPadding?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Card({ children, onPress, style, noPadding = false }: CardProps) {
  const { colors, spacing, radii } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    ...(!noPadding && { padding: spacing.base }),
    // Subtle shadow for light mode, none for dark
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={cardStyle}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
