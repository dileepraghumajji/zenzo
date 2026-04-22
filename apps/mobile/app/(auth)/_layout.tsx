import { Stack } from 'expo-router';
import { useTheme } from '../../lib/theme-context';

export default function AuthLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surfacePage },
        animation: 'slide_from_right',
      }}
    />
  );
}
