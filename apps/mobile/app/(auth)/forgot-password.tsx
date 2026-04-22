import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../components/ui/Toast';

export default function ForgotPasswordScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      showToast({ type: 'error', message: 'Please enter your email.' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      showToast({ type: 'error', message: error.message });
      setLoading(false);
      return;
    }

    setLoading(false);
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfacePage }}>
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
          
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.statusSuccess}20`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl }}>
            <Text style={{ fontSize: 32 }}>✉️</Text>
          </View>
          
          <Text style={{ fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' }}>
            Check your email
          </Text>
          <Text style={{ fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing['2xl'] }}>
            We've sent a password reset link to {email}.
          </Text>

          <Button title="Back to log in" onPress={() => router.push('/(auth)/login')} fullWidth variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

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
              Reset password
            </Text>
            <Text style={{
              fontSize: typography.size.md,
              color: colors.textSecondary,
            }}>
              Enter your email to receive a reset link.
            </Text>
          </View>

          <View style={{ marginBottom: spacing.xl }}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <Button 
            title="Send Reset Link" 
            fullWidth 
            loading={loading} 
            onPress={handleReset} 
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing['2xl'] }}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: colors.actionPrimary, fontWeight: typography.weight.semibold, fontSize: typography.size.md }}>
                Back to log in
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
