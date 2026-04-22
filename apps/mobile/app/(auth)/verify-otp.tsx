import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { getPostAuthDestination } from '../../lib/post-auth-router';

export default function VerifyOtpScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const phone = params.phone as string;
  const email = params.email as string;
  const password = params.password as string;
  const fullName = params.fullName as string;

  const handleVerify = async () => {
    if (code !== '123456') {
      showToast({ type: 'error', message: 'Invalid OTP code. Try 123456.' });
      return;
    }

    setLoading(true);

    try {
      // Create user via Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          }
        }
      });

      if (error) {
        showToast({ type: 'error', message: error.message });
        setLoading(false);
        return;
      }

      // Check where to route next
      const destination = await getPostAuthDestination(data.user);
      
      // On success, navigating automatically sets context wrapper state
      router.replace(destination as any);
      
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Signup failed.' });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfacePage }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, justifyContent: 'center' }}>
          
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{
              fontSize: typography.size['3xl'],
              fontWeight: typography.weight.bold,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}>
              Verify your phone
            </Text>
            <Text style={{
              fontSize: typography.size.md,
              color: colors.textSecondary,
            }}>
              We sent a code to {phone || 'your number'}
            </Text>
          </View>

          <View style={{ marginBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <TextInput
                style={{
                  height: 60,
                  width: '100%',
                  borderColor: colors.borderDefault,
                  borderWidth: 1,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceRaised,
                  color: colors.textPrimary,
                  fontSize: 24,
                  letterSpacing: 10,
                  textAlign: 'center',
                  fontWeight: typography.weight.bold,
                }}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: typography.size.sm, textAlign: 'center', marginTop: spacing.md }}>
              Dummy OTP is 123456
            </Text>
          </View>

          <Button 
            title="Verify" 
            fullWidth 
            loading={loading} 
            disabled={code.length !== 6 || loading}
            onPress={handleVerify} 
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing['2xl'] }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.md }}>
              Didn't receive a code?{' '}
            </Text>
            <TouchableOpacity onPress={() => showToast({ type: 'info', message: 'Dummy OTP resent: 123456' })}>
              <Text style={{ color: colors.actionPrimary, fontWeight: typography.weight.semibold, fontSize: typography.size.md }}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
