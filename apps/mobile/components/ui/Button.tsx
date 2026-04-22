import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';

// ─── Types ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const { colors, radii } = useTheme();

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    opacity: isDisabled ? 0.5 : 1,
    ...(fullWidth && { width: '100%' }),
    ...sizeStyles[size],
    ...getVariantStyle(variant, colors),
    ...style,
  };

  const textStyle: TextStyle = {
    fontWeight: '600',
    ...sizeTextStyles[size],
    ...getVariantTextStyle(variant, colors),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary}
          style={{ marginRight: 8 }}
        />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── Variant Styles ─────────────────────────────────────────────────────────

function getVariantStyle(variant: ButtonVariant, colors: ReturnType<typeof useTheme>['colors']): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.primary };
    case 'secondary':
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.borderDefault };
    case 'danger':
      return { backgroundColor: colors.dangerBg };
    case 'ghost':
      return { backgroundColor: 'transparent' };
  }
}

function getVariantTextStyle(variant: ButtonVariant, colors: ReturnType<typeof useTheme>['colors']): TextStyle {
  switch (variant) {
    case 'primary':
      return { color: colors.textInverse };
    case 'secondary':
      return { color: colors.textPrimary };
    case 'danger':
      return { color: colors.textInverse };
    case 'ghost':
      return { color: colors.primary };
  }
}

// ─── Size Styles ────────────────────────────────────────────────────────────

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
  md: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 52 },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
};
