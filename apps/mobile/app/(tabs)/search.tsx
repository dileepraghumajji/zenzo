import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '../../lib/theme-context';
import { apiFetch } from '../../lib/api';
import { ClubCard, type ClubCardProps } from '../../components/search/ClubCard';
import { ClubCardSkeleton } from '../../components/search/ClubCardSkeleton';
import { AdvancedFilters, type FilterState } from '../../components/search/AdvancedFilters';
import { ActiveFilterChips, type ActiveFilter } from '../../components/search/ActiveFilterChips';
import { NearMeButton } from '../../components/search/NearMeButton';
import { FeaturedCarousel } from '../../components/search/FeaturedCarousel';

export default function SearchScreen() {
  const { colors, typography, spacing, radii } = useTheme();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Ref for debouncing search input
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [filters, setFilters] = useState<FilterState>({ sortBy: 'relevance' });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 400);
  };

  const fetchClubs = async ({ pageParam }: { pageParam: string | null }) => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.append('q', debouncedQuery);
    if (filters.category) params.append('category', filters.category);
    if (filters.priceRange) params.append('price_range', filters.priceRange);
    if (filters.minRating) params.append('min_rating', filters.minRating);
    if (filters.sortBy) params.append('sort', filters.sortBy);
    if (location) {
      params.append('lat', location.lat.toString());
      params.append('lng', location.lng.toString());
    }
    if (pageParam) params.append('cursor', pageParam);

    return apiFetch(`/api/search/clubs?${params.toString()}`);
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['search-clubs', debouncedQuery, filters, location],
    queryFn: fetchClubs,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });

  const clubs = data?.pages.flatMap((page: any) => page.clubs) ?? [];

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const removeFilter = (filterId: string) => {
    setFilters((prev) => {
      const updated = { ...prev };
      if (filterId === 'category') delete updated.category;
      if (filterId === 'priceRange') delete updated.priceRange;
      if (filterId === 'minRating') delete updated.minRating;
      if (filterId === 'location') setLocation(null);
      return updated;
    });
  };

  const activeChips: ActiveFilter[] = useMemo(() => {
    const chips: ActiveFilter[] = [];
    if (filters.category) chips.push({ id: 'category', label: `Category: ${filters.category.replace('_', ' ')}`, value: filters.category });
    if (filters.priceRange) chips.push({ id: 'priceRange', label: `Price: ${filters.priceRange}`, value: filters.priceRange });
    if (filters.minRating) chips.push({ id: 'minRating', label: `Rating: ${filters.minRating}+`, value: filters.minRating });
    if (location) chips.push({ id: 'location', label: 'Near Me', value: 'loc' });
    return chips;
  }, [filters, location]);

  const renderHeader = () => (
    <>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSubtle,
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              height: 44,
              borderWidth: 1,
              borderColor: colors.borderDefault,
            }}
          >
            <Text style={{ marginRight: spacing.sm, fontSize: 16 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, color: colors.textPrimary, fontSize: typography.size.base }}
              placeholder="Search clubs, martial arts..."
              placeholderTextColor={colors.textPlaceholder}
              value={query}
              onChangeText={handleSearchChange}
              onEndEditing={() => {
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                setDebouncedQuery(query);
              }}
            />
            {query.length > 0 && (
              <Pressable onPress={() => handleSearchChange('')}>
                <Text style={{ color: colors.textTertiary, fontSize: 16, padding: spacing.xs }}>✕</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => bottomSheetRef.current?.expand()}
            style={{
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              backgroundColor: colors.surfaceSubtle,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: colors.borderDefault,
            }}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <NearMeButton
            isActive={location !== null}
            onLocationFound={(lat, lng) => setLocation({ lat, lng })}
            onClear={() => setLocation(null)}
          />
        </View>
      </View>

      <ActiveFilterChips filters={activeChips} onRemove={removeFilter} />

      {(!debouncedQuery && activeChips.length === 0) && (
        <FeaturedCarousel />
      )}
    </>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={{ alignItems: 'center', padding: spacing.xl, marginTop: spacing.xl }}>
        <Text style={{ fontSize: 40, marginBottom: spacing.md }}>📭</Text>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.bold, marginBottom: spacing.sm }}>
          No clubs found
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: typography.size.base }}>
          Try adjusting your search or filters to find what you're looking for.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: spacing['4xl'] }} />;
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // 10 shimmers for loading state
  const skeletonData = Array.from({ length: 10 }).map((_, i) => ({ id: `skel-${i}` }) as any);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surfacePage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={isLoading ? skeletonData : clubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing['4xl'] }}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: spacing.md }}>
            {isLoading ? <ClubCardSkeleton /> : <ClubCard {...item} />}
          </View>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isLoading) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
      />

      <AdvancedFilters ref={bottomSheetRef} initialFilters={filters} onApply={handleApplyFilters} />
    </KeyboardAvoidingView>
  );
}
