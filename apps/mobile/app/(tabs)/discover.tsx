import React, { useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { ClubCard, type ClubCardProps } from '../../components/search/ClubCard';
import { ClubCardSkeleton } from '../../components/search/ClubCardSkeleton';

interface DiscoverResponse {
  inviteCount: number;
  userCity: string | null;
  clubs: ClubCardProps[];
  hasMore: boolean;
  nextCursor: number | null;
}

export default function DiscoverScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<DiscoverResponse>({
    queryKey: ['discover'],
    queryFn: () => apiFetch('/api/discover'),
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const headingText = data?.userCity
    ? `For you in ${data.userCity}`
    : 'Clubs matching your interests';

  const renderHeader = () => (
    <View style={{ marginBottom: spacing.lg }}>
      {data?.inviteCount ? (
        <Pressable
          style={{
            backgroundColor: `${colors.warningBg}E6`, // transparent bg
            padding: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.warningBorder,
            marginBottom: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={() => router.push('/portal/invites')}
        >
          <Text style={{ color: colors.warningText, fontWeight: typography.weight.medium, fontSize: typography.size.base }}>
            You have {data.inviteCount} pending {data.inviteCount === 1 ? 'invite' : 'invites'}
          </Text>
          <Text style={{ color: colors.warningText, fontWeight: typography.weight.bold, fontSize: typography.size.lg }}>→</Text>
        </Pressable>
      ) : null}

      <Text style={{ color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.bold }}>
        {headingText}
      </Text>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null; // Skeletons are rendered directly when loading
    return (
      <View style={{ alignItems: 'center', marginTop: spacing['3xl'] }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.base, textAlign: 'center', marginBottom: spacing.xl }}>
          No clubs match your interests{data?.userCity ? ` in ${data.userCity}` : ''} yet.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoading) return null;
    return (
      <Pressable
        style={{ marginTop: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' }}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Text style={{ color: colors.textBrand, fontSize: typography.size.md, fontWeight: typography.weight.semibold }}>
          Explore all clubs →
        </Text>
      </Pressable>
    );
  };

  const onRefresh = () => {
    refetch();
  };

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfacePage, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, marginBottom: spacing.md }}>
          Something went wrong loading your feed.
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.md }}
        >
          <Text style={{ color: colors.textInverse, fontWeight: typography.weight.bold }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Generate 6 shimmers
  const skeletonData = Array.from({ length: 6 }).map((_, i) => ({ id: `skel-${i}` }) as any);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfacePage }}>
      <FlatList
        data={isLoading ? skeletonData : data?.clubs}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing['4xl'], // Safe area + tab bar space roughly
        }}
        columnWrapperStyle={{ gap: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListHeaderComponent={!isLoading ? renderHeader() : <View style={{ marginBottom: spacing.lg }}><View style={{ height: 32, width: 200, backgroundColor: colors.skeleton, borderRadius: radii.md }} /></View>}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => {
          if (isLoading) {
            return <ClubCardSkeleton style={{ flex: 1 }} />;
          }
          return <ClubCard {...item} style={{ flex: 1 }} />;
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}
