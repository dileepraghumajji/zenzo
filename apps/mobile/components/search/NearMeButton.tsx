import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../lib/theme-context';
import { useToast } from '../ui/Toast';

interface NearMeButtonProps {
  onLocationFound: (lat: number, lng: number) => void;
  onClear: () => void;
  isActive: boolean;
}

export function NearMeButton({ onLocationFound, onClear, isActive }: NearMeButtonProps) {
  const { colors, typography, spacing, radii } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handlePress = async () => {
    if (isActive) {
      onClear();
      return;
    }

    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showToast('Location permission denied', 'error');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      onLocationFound(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error(error);
      showToast('Could not fetch location', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isActive ? `${colors.primary}20` : colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: isActive ? colors.primary : colors.borderDefault,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.xs }} />
      ) : (
        <Text style={{ marginRight: spacing.xs }}>📍</Text>
      )}
      <Text
        style={{
          color: isActive ? colors.primary : colors.textPrimary,
          fontSize: typography.size.sm,
          fontWeight: typography.weight.medium,
        }}
      >
        {isActive ? 'Near You' : 'Near Me'}
      </Text>
      {isActive && !isLoading && (
        <Text
          style={{
            marginLeft: spacing.xs,
            color: colors.primary,
            fontSize: typography.size.sm,
          }}
        >
          ✕
        </Text>
      )}
    </Pressable>
  );
}
