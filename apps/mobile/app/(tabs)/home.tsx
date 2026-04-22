import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfacePage }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center' }}>
        <Text style={{ fontSize: typography.size['2xl'], color: colors.textPrimary, marginBottom: spacing.md }}>
          Home Tab
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.xl }}>
          (Mock Tab Screen)
        </Text>
        <Button 
          title="Sign Out" 
          variant="danger" 
          onPress={async () => {
             await supabase.auth.signOut();
             // Root navigator will automatically re-route us to login
          }} 
        />
      </View>
    </View>
  );
}
