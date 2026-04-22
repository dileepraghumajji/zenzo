import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme-context';

// ─── Types ──────────────────────────────────────────────────────────────────

type BadgeStatus = 'active' | 'overdue' | 'expired' | 'pending' | 'trial' | 'info';

interface BadgeProps {
  status: BadgeStatus;
  /** Custom label — if not set, uses status name */
  label?: string;
  style?: ViewStyle;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Badge({ status, label, style }: BadgeProps) {
  const { colors, typography, radii, spacing } = useTheme();

  const config = getBadgeConfig(status, colors);
  const displayLabel = label ?? config.defaultLabel;

  return (
    <View
      style={[
        {
          backgroundColor: config.bg,
          borderRadius: radii.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: typography.size.xs,
          fontWeight: typography.weight.semibold,
          color: config.text,
          // Prevent text from being cut off
          includeFontPadding: false,
        }}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

// ─── Config ─────────────────────────────────────────────────────────────────

function getBadgeConfig(
  status: BadgeStatus,
  colors: ReturnType<typeof useTheme>['colors']
) {
  switch (status) {
    case 'active':
      return { bg: colors.successBg, text: colors.successText, defaultLabel: 'Active' };
    case 'overdue':
      return { bg: colors.warningBg, text: colors.warningText, defaultLabel: 'Overdue' };
    case 'expired':
      return { bg: colors.errorBg, text: colors.errorText, defaultLabel: 'Expired' };
    case 'pending':
      return {
        bg: colors.surfaceSubtle,
        text: colors.textTertiary,
        defaultLabel: 'Pending',
      };
    case 'trial':
      return { bg: colors.infoBg, text: colors.infoText, defaultLabel: 'Trial' };
    case 'info':
      return { bg: colors.primaryBg, text: colors.textBrand, defaultLabel: 'Info' };
  }
}
