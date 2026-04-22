import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type ColorTokens,
  lightColors,
  darkColors,
  spacing,
  typography,
  radii,
  getColors,
} from '../constants/theme';

// ─── Types ──────────────────────────────────────────────────────────────────

type ColorScheme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** Resolved color scheme currently active */
  colorScheme: ColorScheme;
  /** User's preference — 'system' follows device */
  preference: ThemePreference;
  /** Active color tokens */
  colors: ColorTokens;
  /** Spacing scale */
  spacing: typeof spacing;
  /** Typography scale */
  typography: typeof typography;
  /** Border radii */
  radii: typeof radii;
  /** Set preference: 'light', 'dark', or 'system' */
  setPreference: (pref: ThemePreference) => void;
  /** Convenience toggle between light and dark */
  toggleTheme: () => void;
  /** Whether the current scheme is dark */
  isDark: boolean;
}

const STORAGE_KEY = 'zenzo_theme_preference';

// ─── Context ────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreferenceState(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const resolvedScheme: ColorScheme = useMemo(() => {
    if (preference === 'system') {
      return deviceScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, deviceScheme]);

  const toggleTheme = useCallback(() => {
    const next = resolvedScheme === 'dark' ? 'light' : 'dark';
    setPreference(next);
  }, [resolvedScheme, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: resolvedScheme,
      preference,
      colors: getColors(resolvedScheme),
      spacing,
      typography,
      radii,
      setPreference,
      toggleTheme,
      isDark: resolvedScheme === 'dark',
    }),
    [resolvedScheme, preference, setPreference, toggleTheme]
  );

  // Don't render children until we've loaded the saved preference
  // to avoid a flash of wrong theme
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
