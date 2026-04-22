import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      const redirectUrl = Linking.createURL('/(auth)/signup'); 
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success') {
          const urlObj = Linking.parse(result.url);
          if (urlObj.queryParams?.code) {
             const { error } = await supabase.auth.exchangeCodeForSession(urlObj.queryParams.code as string);
             if (error) throw error;
          } else if (result.url.includes('#')) {
             const fragment = result.url.split('#')[1];
             const params = Object.fromEntries(new URLSearchParams(fragment));
             if (params.access_token) {
                 await supabase.auth.setSession({
                    access_token: params.access_token,
                    refresh_token: params.refresh_token || ''
                 });
             }
          }
        }
      }
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Error via Google' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      showToast({ type: 'error', message: 'All fields are required.' });
      return;
    }

    if (password.length < 8) {
      showToast({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);

    // MOCK API CALL for OTP Generation
    setTimeout(() => {
      setLoading(false);
      showToast({ type: 'success', message: 'OTP sent: 123456 (Mocked)' });
      
      // We pass the data through to verify-otp so it can actually perform the signup when successful.
      // In a real flow, OTP would be generated on the backend and we wouldn't pass password via URL.
      // For this mock, we pass the data so `verify-otp` knows what to sign up with.
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone, email, password, fullName }
      });
    }, 1000);
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
              Create your account
            </Text>
            <Text style={{
              fontSize: typography.size.md,
              color: colors.textSecondary,
            }}>
              Join Zenzo today.
            </Text>
          </View>

          <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
            <Input
              label="Full Name"
              placeholder="Rahul Sharma"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
            
            <Input
              label="Phone"
              placeholder="+91 98765 43210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            
            <Input
              label="Password"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              hint="Use a mix of letters, numbers, and symbols"
            />
          </View>

          <Button 
            title="Sign Up" 
            fullWidth 
            loading={loading} 
            disabled={googleLoading}
            onPress={handleSignup} 
          />

          <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderDefault }} />
              <Text style={{ marginHorizontal: spacing.md, color: colors.textTertiary, fontSize: typography.size.sm }}>
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderDefault }} />
            </View>
          </View>
          
          <Button 
            title="Continue with Google" 
            variant="secondary" 
            fullWidth 
            loading={googleLoading} 
            disabled={loading}
            onPress={handleGoogleAuth} 
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing['2xl'] }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.md }}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: colors.actionPrimary, fontWeight: typography.weight.semibold, fontSize: typography.size.md }}>
                Log in
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
