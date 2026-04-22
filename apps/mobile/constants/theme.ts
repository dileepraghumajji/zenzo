// ─── Zenzo Mobile Design Tokens ─────────────────────────────────────────────
// Clean, minimal palette: pure white/black surfaces + forge orange primary.
// Inspired by Swiggy, Zomato, and other top consumer apps.
// All components consume these via useTheme() — never hardcode colors.
// ─────────────────────────────────────────────────────────────────────────────

export interface ColorTokens {
  // Surfaces — pure white/black, no warm shades
  surfacePage: string;
  surfaceCard: string;
  surfaceSubtle: string;
  surfaceBrand: string;

  // Primary (forge orange)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string; // very light tint for backgrounds

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textPlaceholder: string;
  textDisabled: string;
  textInverse: string;
  textBrand: string;

  // Borders
  borderDefault: string;
  borderStrong: string;
  borderFocus: string;
  borderError: string;

  // Status
  successBg: string;
  successText: string;
  successBorder: string;
  warningBg: string;
  warningText: string;
  warningBorder: string;
  errorBg: string;
  errorText: string;
  errorBorder: string;
  infoBg: string;
  infoText: string;
  infoBorder: string;

  // Danger action
  dangerBg: string;
  dangerBgHover: string;

  // Overlay
  overlay: string;

  // Misc
  skeleton: string;
  skeletonHighlight: string;
  tabBarBg: string;
  tabBarBorder: string;
}

// ─── Light Mode ─────────────────────────────────────────────────────────────
// Pure white backgrounds, clean gray text hierarchy, forge orange accent.
export const lightColors: ColorTokens = {
  // Surfaces — pure white
  surfacePage: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceSubtle: '#F5F5F5',
  surfaceBrand: '#FFF3E8',

  // Primary — forge orange
  primary: '#C84A08',
  primaryLight: '#EF6014',
  primaryDark: '#A13907',
  primaryBg: '#FFF3E8',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textTertiary: '#8A8A8A',
  textPlaceholder: '#B0B0B0',
  textDisabled: '#CCCCCC',
  textInverse: '#FFFFFF',
  textBrand: '#C84A08',

  // Borders
  borderDefault: '#E8E8E8',
  borderStrong: '#D0D0D0',
  borderFocus: '#EF6014',
  borderError: '#DC2626',

  // Status
  successBg: '#F0FDF5',
  successText: '#15803D',
  successBorder: '#16A34A',
  warningBg: '#FFFBEB',
  warningText: '#B45309',
  warningBorder: '#D97706',
  errorBg: '#FFF1F2',
  errorText: '#B91C1C',
  errorBorder: '#DC2626',
  infoBg: '#EFF9FF',
  infoText: '#0369A1',
  infoBorder: '#0284C7',

  // Danger
  dangerBg: '#DC2626',
  dangerBgHover: '#B91C1C',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Misc
  skeleton: '#E8E8E8',
  skeletonHighlight: '#F5F5F5',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E8E8E8',
};

// ─── Dark Mode ──────────────────────────────────────────────────────────────
// Pure black backgrounds, clean light text, forge orange accent pops.
export const darkColors: ColorTokens = {
  // Surfaces — pure black
  surfacePage: '#000000',
  surfaceCard: '#1C1C1E',
  surfaceSubtle: '#111111',
  surfaceBrand: '#1A0F05',

  // Primary — forge orange (slightly brighter for dark bg contrast)
  primary: '#EF6014',
  primaryLight: '#F88030',
  primaryDark: '#C84A08',
  primaryBg: '#1A0F05',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#6A6A6A',
  textPlaceholder: '#4A4A4A',
  textDisabled: '#3A3A3A',
  textInverse: '#000000',
  textBrand: '#F88030',

  // Borders
  borderDefault: '#2C2C2E',
  borderStrong: '#3A3A3C',
  borderFocus: '#EF6014',
  borderError: '#EF4444',

  // Status
  successBg: '#0A1A0D',
  successText: '#4ADE80',
  successBorder: '#14532D',
  warningBg: '#1A1005',
  warningText: '#FCD34D',
  warningBorder: '#713F12',
  errorBg: '#1A0808',
  errorText: '#FCA5A5',
  errorBorder: '#7F1D1D',
  infoBg: '#061220',
  infoText: '#7DD3FC',
  infoBorder: '#0C4A6E',

  // Danger
  dangerBg: '#DC2626',
  dangerBgHover: '#EF4444',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.75)',

  // Misc
  skeleton: '#2C2C2E',
  skeletonHighlight: '#3A3A3C',
  tabBarBg: '#000000',
  tabBarBorder: '#2C2C2E',
};

// ─── Spacing Scale ──────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────
export const typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ─── Radii ──────────────────────────────────────────────────────────────────
export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// ─── Helper ─────────────────────────────────────────────────────────────────
export function getColors(scheme: 'light' | 'dark'): ColorTokens {
  return scheme === 'dark' ? darkColors : lightColors;
}
