import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import type { ClubCategory } from '@zenzo/database';

export interface ClubCardProps {
  id: string;
  slug: string;
  name: string;
  business_type: ClubCategory;
  city: string;
  description: string | null;
  avg_rating?: number;
  logo_url: string | null;
}

const CATEGORY_MAP: Record<string, { emoji: string; label: string }> = {
  gym: { emoji: '🏋️', label: 'Gym' },
  martial_arts: { emoji: '🥋', label: 'Martial Arts' },
  dance: { emoji: '💃', label: 'Dance' },
  yoga: { emoji: '🧘', label: 'Yoga' },
  other: { emoji: '🎯', label: 'Other' },
};

interface Props extends ClubCardProps {
  style?: StyleProp<ViewStyle>;
}

export function ClubCard({
  slug,
  name,
  business_type,
  city,
  description,
  avg_rating,
  logo_url,
  style,
}: Props) {
  const { colors, typography, radii, spacing } = useTheme();
  const router = useRouter();

  const categoryInfo = CATEGORY_MAP[business_type] || CATEGORY_MAP.other;

  return (
    <Pressable
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
      onPress={() => router.push(`/club/${slug}`)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        {logo_url ? (
          <Image
            source={{ uri: logo_url }}
            style={{ width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.surfaceSubtle }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radii.md,
              backgroundColor: colors.surfaceBrand,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>{categoryInfo.emoji}</Text>
          </View>
        )}

        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
              {city}
            </Text>
            {!!avg_rating && avg_rating > 0 && (
              <>
                <Text style={{ color: colors.textPlaceholder, marginHorizontal: 4 }}>•</Text>
                <Text style={{ color: colors.warningText, fontSize: typography.size.sm, fontWeight: typography.weight.medium }}>
                  ★ {avg_rating.toFixed(1)}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
        <View
          style={{
            backgroundColor: colors.surfaceSubtle,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: colors.borderDefault,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, fontWeight: typography.weight.medium }}>
            {categoryInfo.label}
          </Text>
        </View>
      </View>

      {!!description && (
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: typography.size.xs,
            lineHeight: typography.size.xs * typography.lineHeight.normal,
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      )}
    </Pressable>
  );
}
