import React from 'react';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { useTheme } from '../../lib/theme-context';

export interface ActiveFilter {
  id: string; // e.g. 'category', 'price', 'amenity-ac'
  label: string; // 'Gym', '₹ Budget', 'AC'
  value: string; // internal value
}

interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onRemove: (filterId: string) => void;
}

export function ActiveFilterChips({ filters, onRemove }: ActiveFilterChipsProps) {
  const { colors, typography, spacing, radii } = useTheme();

  if (filters.length === 0) return null;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
      >
        {filters.map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => onRemove(filter.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.full,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                marginRight: spacing.xs,
              }}
            >
              {filter.label}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
              }}
            >
              ✕
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
