import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import type { ClubCategory } from '@zenzo/database';
import { Skeleton } from '../ui/Skeleton';

interface FeaturedClub {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  cover_image_url: string | null;
  business_type: ClubCategory;
  city: string | null;
  avg_rating: number | null;
}

export function FeaturedCarousel() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<{ clubs: FeaturedClub[] }>({
    queryKey: ['featured-clubs'],
    queryFn: () => apiFetch('/api/search/featured'),
    staleTime: 5 * 60 * 1000,
  });

  if (isError) return null;

  const renderSkeleton = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={{ width: 260, borderRadius: radii.lg, backgroundColor: colors.surfaceCard, padding: spacing.sm, borderWidth: 1, borderColor: colors.borderDefault }}>
          <Skeleton width="100%" height={140} borderRadius={radii.md} />
          <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.xs, gap: spacing.xs }}>
            <Skeleton width="80%" height={16} />
            <Skeleton width="40%" height={14} />
          </View>
        </View>
      ))}
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={{ marginVertical: spacing.lg }}>
        <Text style={{ marginLeft: spacing.md, marginBottom: spacing.md, color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.bold }}>
          Featured Clubs
        </Text>
        {renderSkeleton()}
      </View>
    );
  }

  const clubs = data?.clubs ?? [];
  if (clubs.length === 0) return null;

  return (
    <View style={{ marginVertical: spacing.lg }}>
      <Text style={{ marginLeft: spacing.md, marginBottom: spacing.md, color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.bold }}>
        Featured Clubs
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}
        snapToInterval={260 + spacing.md}
        decelerationRate="fast"
      >
        {clubs.map((club) => (
          <Pressable
            key={club.id}
            onPress={() => router.push(`/club/${club.slug}`)}
            style={{
              width: 260,
              backgroundColor: colors.surfaceCard,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.borderDefault,
              overflow: 'hidden',
            }}
          >
            {club.cover_image_url ? (
              <Image
                source={{ uri: club.cover_image_url }}
                style={{ width: '100%', height: 140, backgroundColor: colors.surfaceSubtle }}
                contentFit="cover"
              />
            ) : (
              <View style={{ width: '100%', height: 140, backgroundColor: colors.surfaceBrand, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: typography.size.xl, opacity: 0.5 }}>
                  {club.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={{ padding: spacing.md }}>
              <Text
                style={{ color: colors.textPrimary, fontSize: typography.size.base, fontWeight: typography.weight.bold, marginBottom: spacing.xs }}
                numberOfLines={1}
              >
                {club.name}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, textTransform: 'capitalize' }}>
                  {club.business_type.replace('_', ' ')} {club.city ? `• ${club.city}` : ''}
                </Text>
                {!!club.avg_rating && club.avg_rating > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.full }}>
                    <Text style={{ color: colors.warningText, fontSize: typography.size.xs, fontWeight: typography.weight.bold }}>
                      ★ {club.avg_rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
