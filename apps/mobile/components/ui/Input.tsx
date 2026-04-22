import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Input({
  label,
  error,
  hint,
  containerStyle,
  ...props
}: InputProps) {
  const { colors, spacing, typography, radii } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.borderError
    : isFocused
      ? colors.borderFocus
      : colors.borderDefault;

  return (
    <View style={[{ marginBottom: spacing.base }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.medium,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
          }}
        >
          {label}
        </Text>
      )}

      <RNTextInput
        {...props}
        style={{
          backgroundColor: colors.surfaceCard,
          borderWidth: 1.5,
          borderColor,
          borderRadius: radii.md,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          fontSize: typography.size.base,
          color: colors.textPrimary,
          minHeight: 48,
        }}
        placeholderTextColor={colors.textPlaceholder}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
      />

      {error && (
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.errorText,
            marginTop: spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.textTertiary,
            marginTop: spacing.xs,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}
