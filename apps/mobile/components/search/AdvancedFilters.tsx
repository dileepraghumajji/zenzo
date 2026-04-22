import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '../../lib/theme-context';
import { ClubCategory } from '@zenzo/database';

export interface FilterState {
  category?: ClubCategory;
  priceRange?: string;
  minRating?: string;
  sortBy: string;
}

interface AdvancedFiltersProps {
  initialFilters: FilterState;
  onApply: (filters: FilterState) => void;
}

const CATEGORIES = [
  { id: 'gym', label: 'Gym' },
  { id: 'martial_arts', label: 'Martial Arts' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'dance', label: 'Dance' },
  { id: 'other', label: 'Other' },
];

const PRICE_RANGES = [
  { id: 'budget', label: 'Budget' },
  { id: 'mid', label: 'Mid' },
  { id: 'premium', label: 'Premium' },
];

const RATINGS = [
  { id: '4', label: '4.0+' },
  { id: '3', label: '3.0+' },
  { id: 'any', label: 'Any' },
];

const SORTS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'rating', label: 'Rating' },
  { id: 'price_asc', label: 'Price: Low to High' },
];

export const AdvancedFilters = forwardRef<BottomSheet, AdvancedFiltersProps>(
  ({ initialFilters, onApply }, ref) => {
    const { colors, typography, spacing, radii } = useTheme();

    // Internal state for pending selections before applying
    const [localFilters, setLocalFilters] = useState<FilterState>(initialFilters);

    // Update local state when parent props change and sheet is opened
    // Wait, let's keep it simple. Local state resets to initialFilters whenever opened?
    // We'll manage resetting outside or handle inside.

    const snapPoints = useMemo(() => ['70%', '90%'], []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      []
    );

    const handleApply = () => {
      onApply(localFilters);
      if (typeof ref !== 'function' && ref?.current) {
        ref.current.close();
      }
    };

    const handleClear = () => {
      const reset: FilterState = { sortBy: 'relevance' };
      setLocalFilters(reset);
      onApply(reset);
      if (typeof ref !== 'function' && ref?.current) {
        ref.current.close();
      }
    };

    const renderSectionTitle = (title: string) => (
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          marginTop: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        {title}
      </Text>
    );

    const renderChip = (
      label: string,
      isActive: boolean,
      onPress: () => void
    ) => (
      <Pressable
        key={label}
        onPress={onPress}
        style={{
          backgroundColor: isActive ? `${colors.primary}20` : colors.surfaceSubtle,
          borderWidth: 1,
          borderColor: isActive ? colors.primary : colors.borderDefault,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.full,
          marginRight: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <Text
          style={{
            color: isActive ? colors.primary : colors.textPrimary,
            fontSize: typography.size.sm,
            fontWeight: isActive ? typography.weight.bold : typography.weight.medium,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1} // Closed by default
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surfacePage }}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
        onChange={(index) => {
          if (index === -1) {
            // Restore local filters to active if sheet closed without applying
            setLocalFilters(initialFilters);
          }
        }}
      >
        <View style={{ flex: 1 }}>
          <BottomSheetScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: typography.size.xl,
                fontWeight: typography.weight.bold,
                textAlign: 'center',
                marginVertical: spacing.md,
              }}
            >
              Filters
            </Text>

            {renderSectionTitle('Category')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {CATEGORIES.map((c) =>
                renderChip(c.label, localFilters.category === c.id, () =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    category: prev.category === c.id ? undefined : (c.id as ClubCategory),
                  }))
                )
              )}
            </View>

            {renderSectionTitle('Price Range')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PRICE_RANGES.map((p) =>
                renderChip(p.label, localFilters.priceRange === p.id, () =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    priceRange: prev.priceRange === p.id ? undefined : p.id,
                  }))
                )
              )}
            </View>

            {renderSectionTitle('Minimum Rating')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {RATINGS.map((r) =>
                renderChip(r.label, (localFilters.minRating || 'any') === r.id, () =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    minRating: r.id === 'any' ? undefined : r.id,
                  }))
                )
              )}
            </View>

            {renderSectionTitle('Sort By')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {SORTS.map((s) =>
                renderChip(s.label, localFilters.sortBy === s.id, () =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    sortBy: s.id,
                  }))
                )
              )}
            </View>
          </BottomSheetScrollView>

          {/* Footer Actions */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              padding: spacing.md,
              paddingBottom: spacing.xl,
              backgroundColor: colors.surfacePage,
              borderTopWidth: 1,
              borderColor: colors.borderDefault,
            }}
          >
            <Pressable
              onPress={handleClear}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: spacing.sm,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: typography.weight.bold, fontSize: typography.size.md }}>
                Clear All
              </Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              style={{
                flex: 2,
                backgroundColor: colors.primary,
                borderRadius: radii.md,
                paddingVertical: spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.textInverse, fontWeight: typography.weight.bold, fontSize: typography.size.md }}>
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    );
  }
);
