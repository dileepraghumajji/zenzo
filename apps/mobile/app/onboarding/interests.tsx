import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { apiFetch } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';

// ─── Interest data from shared package ──────────────────────────────────────
// We inline the data here to avoid Metro resolution issues with workspace packages.
// The source of truth is @zenzo/database enums.ts — keep in sync.

const INTEREST_CATEGORIES = [
  { slug: 'martial_arts', label: 'Martial Arts', icon: '🥋' },
  { slug: 'fitness',      label: 'Fitness',      icon: '💪' },
  { slug: 'dance',        label: 'Dance',        icon: '💃' },
  { slug: 'yoga',         label: 'Yoga',         icon: '🧘' },
  { slug: 'boxing',       label: 'Boxing',       icon: '🥊' },
  { slug: 'swimming',     label: 'Swimming',     icon: '🏊' },
  { slug: 'crossfit',     label: 'CrossFit',     icon: '🏋️' },
  { slug: 'other',        label: 'Other',        icon: '🎯' },
] as const;

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
  'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
  'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
  'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah',
  'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
  'Madurai', 'Raipur', 'Kochi', 'Chandigarh', 'Mysuru',
  'Gurgaon', 'Noida', 'Thiruvananthapuram', 'Dehradun', 'Mangaluru',
];

type InterestSlug = (typeof INTEREST_CATEGORIES)[number]['slug'];

// ─── Interest Card ──────────────────────────────────────────────────────────

function InterestCard({
  item,
  selected,
  onToggle,
  colors,
  radii,
}: {
  item: (typeof INTEREST_CATEGORIES)[number];
  selected: boolean;
  onToggle: (slug: InterestSlug) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Bounce animation on tap
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle(item.slug);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${item.label} interest${selected ? ', selected' : ''}`}
        accessibilityState={{ selected }}
        style={{
          backgroundColor: selected ? colors.primaryBg : colors.surfaceCard,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.borderDefault,
          borderRadius: radii.lg,
          paddingVertical: 20,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 100,
        }}
      >
        <Text style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: selected ? '700' : '500',
            color: selected ? colors.primary : colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {item.label}
        </Text>
        {/* Selection indicator dot */}
        {selected && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Skeleton Loading Cards ─────────────────────────────────────────────────

function InterestsSkeleton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ width: '47%' }}>
          <Skeleton width="100%" height={100} borderRadius={14} />
        </View>
      ))}
    </View>
  );
}

// ─── City Autocomplete ──────────────────────────────────────────────────────

function CityAutocomplete({
  value,
  onSelect,
  colors,
  radii,
  spacing,
}: {
  value: string;
  onSelect: (city: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  radii: ReturnType<typeof useTheme>['radii'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  const [query, setQuery] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = query.length >= 1
    ? INDIAN_CITIES.filter((c) =>
        c.toLowerCase().startsWith(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelect = (city: string) => {
    setQuery(city);
    setShowDropdown(false);
    onSelect(city);
    Keyboard.dismiss();
  };

  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: spacing.xs,
          letterSpacing: 0.3,
        }}
      >
        Your city
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceCard,
          borderWidth: 1.5,
          borderColor: showDropdown ? colors.borderFocus : colors.borderDefault,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setShowDropdown(true);
            if (text === '') onSelect('');
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="e.g. Hyderabad"
          placeholderTextColor={colors.textPlaceholder}
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontSize: 15,
            paddingVertical: 14,
          }}
          returnKeyType="done"
          onSubmitEditing={() => setShowDropdown(false)}
          accessibilityLabel="City input"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              onSelect('');
              setShowDropdown(false);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Clear city"
          >
            <Text style={{ color: colors.textTertiary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: colors.surfaceCard,
            borderWidth: 1,
            borderColor: colors.borderDefault,
            borderRadius: radii.md,
            overflow: 'hidden',
            // Shadow / elevation
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {filtered.map((city, idx) => (
            <TouchableOpacity
              key={city}
              onPress={() => handleSelect(city)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: 14,
                borderBottomWidth: idx < filtered.length - 1 ? 1 : 0,
                borderBottomColor: colors.borderDefault,
              }}
              accessibilityLabel={`Select ${city}`}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function InterestsScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();

  const [selectedSlugs, setSelectedSlugs] = useState<InterestSlug[]>([]);
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // ─── Prefill existing selections on revisit ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadExisting() {
      try {
        const profile = await apiFetch<{
          interests?: string[];
          city?: string;
        }>('/api/profile', { method: 'GET' });

        if (!cancelled) {
          if (profile.interests && profile.interests.length > 0) {
            setSelectedSlugs(profile.interests as InterestSlug[]);
          }
          if (profile.city) {
            setCity(profile.city);
          }
        }
      } catch {
        // First-time user — no saved interests, that's fine
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }

    loadExisting();
    return () => { cancelled = true; };
  }, []);

  // ─── Toggle selection ───────────────────────────────────────────────────
  const toggleInterest = useCallback((slug: InterestSlug) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  }, []);

  // ─── Save interests ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (selectedSlugs.length === 0) return;
    setSaving(true);
    try {
      await apiFetch('/api/users/interests', {
        method: 'POST',
        body: JSON.stringify({
          slugs: selectedSlugs,
          city: city || undefined,
        }),
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err?.message || 'Could not save your interests. Try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Skip ──────────────────────────────────────────────────────────────
  const handleSkip = async () => {
    setSkipping(true);
    try {
      await apiFetch('/api/users/interests', {
        method: 'POST',
        body: JSON.stringify({ slugs: [], skip: true }),
      });
      router.replace('/(tabs)/home');
    } catch {
      // Even if skip fails, let them through
      router.replace('/(tabs)/home');
    } finally {
      setSkipping(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  const canProceed = selectedSlugs.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfacePage }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing['2xl'],
            paddingBottom: spacing['4xl'],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ──────────────────────────────────────────────── */}
          <Text
            style={{
              fontSize: typography.size['2xl'],
              fontWeight: typography.weight.bold,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            What are you into?
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.textSecondary,
              marginBottom: spacing['2xl'],
              lineHeight: typography.size.sm * typography.lineHeight.relaxed,
            }}
          >
            We'll show you clubs that match. Pick as many as you like.
          </Text>

          {/* ─── Interest Grid ───────────────────────────────────────── */}
          {loadingExisting ? (
            <InterestsSkeleton />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: spacing['2xl'],
              }}
            >
              {INTEREST_CATEGORIES.map((item) => (
                <View key={item.slug} style={{ width: '47%' }}>
                  <InterestCard
                    item={item}
                    selected={selectedSlugs.includes(item.slug)}
                    onToggle={toggleInterest}
                    colors={colors}
                    radii={radii}
                  />
                </View>
              ))}
            </View>
          )}

          {/* ─── Selection count ─────────────────────────────────────── */}
          {selectedSlugs.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.primaryBg,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.full,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {selectedSlugs.length} selected
                </Text>
              </View>
            </View>
          )}

          {/* ─── City Input ──────────────────────────────────────────── */}
          <CityAutocomplete
            value={city}
            onSelect={setCity}
            colors={colors}
            radii={radii}
            spacing={spacing}
          />

          {/* ─── CTAs ────────────────────────────────────────────────── */}
          <View style={{ marginTop: spacing['2xl'] }}>
            <Button
              title={saving ? 'Saving…' : "Let's go →"}
              onPress={handleSave}
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              disabled={!canProceed || saving}
            />

            <TouchableOpacity
              onPress={handleSkip}
              disabled={skipping}
              style={{
                alignItems: 'center',
                marginTop: spacing.lg,
                paddingVertical: spacing.sm,
              }}
              accessibilityLabel="Skip for now"
            >
              {skipping ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                  }}
                >
                  Skip for now →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
