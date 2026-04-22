import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Animated, TouchableOpacity, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number; // ms, default 3000
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

// ─── Singleton controller ───────────────────────────────────────────────────
// Allows showing toasts from anywhere without context (e.g., from API layer).

let _showToast: ((config: ToastConfig) => void) | null = null;

/** Show a toast from anywhere — works after ToastProvider mounts */
export function showToast(config: ToastConfig) {
  _showToast?.(config);
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radii, typography } = useTheme();

  const show = useCallback(
    (config: ToastConfig) => {
      // Clear any existing timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToast(config);
      slideAnim.setValue(-100);

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();

      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, config.duration ?? 3000);
    },
    [slideAnim]
  );

  const dismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [slideAnim]);

  // Register singleton
  useEffect(() => {
    _showToast = show;
    return () => {
      _showToast = null;
    };
  }, [show]);

  const toastColors = toast
    ? getToastColors(toast.type, colors)
    : { bg: colors.surfaceCard, text: colors.textPrimary, icon: '' };

  return (
    <View style={{ flex: 1 }}>
      {children}

      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + spacing.sm,
            left: spacing.base,
            right: spacing.base,
            transform: [{ translateY: slideAnim }],
            zIndex: 9999,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={dismiss}
            style={{
              backgroundColor: toastColors.bg,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.base,
              paddingVertical: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              // Shadow
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
              {toastColors.icon}
            </Text>
            <Text
              style={{
                flex: 1,
                color: toastColors.text,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
              }}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Colors ─────────────────────────────────────────────────────────────────

function getToastColors(
  type: ToastType,
  colors: ReturnType<typeof useTheme>['colors']
) {
  switch (type) {
    case 'success':
      return { bg: colors.successBg, text: colors.successText, icon: '✓' };
    case 'error':
      return { bg: colors.errorBg, text: colors.errorText, icon: '✗' };
    case 'info':
      return { bg: colors.infoBg, text: colors.infoText, icon: 'ℹ' };
  }
}
