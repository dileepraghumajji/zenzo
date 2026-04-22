import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../components/ui/Toast';
import { getPostAuthDestination } from '../../lib/post-auth-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      
      // For Expo Go, this will be something like exp://192.168.x.x:8081
      // For standalone apps, it will be zenzo://
      const redirectUrl = Linking.createURL('/'); 
      
      console.log('--- Auth Debug ---');
      console.log('Redirect URL:', redirectUrl);
      console.log('Ensure this is in Supabase Dashboard -> Auth -> URL Configuration -> Redirect URLs');
      console.log('------------------');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      
      if (error) throw error;
      if (!data?.url) throw new Error('No auth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (result.type === 'success') {
        const { url } = result;
        const decodedUrl = decodeURIComponent(url);
        
        // Handle PKCE code exchange
        if (decodedUrl.includes('code=')) {
          const code = new URL(decodedUrl).searchParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          }
        } 
        // Handle implicit flow (optional backup)
        else if (decodedUrl.includes('access_token=')) {
          const fragment = decodedUrl.split('#')[1];
          const params = Object.fromEntries(new URLSearchParams(fragment));
          if (params.access_token) {
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token || '',
            });
          }
        }

        // On success, getPostAuthDestination will be called by the auth listener or we can trigger it here
        // Since we are in the login screen, we can check if session exists now
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           const dest = await getPostAuthDestination(session.user);
           router.replace(dest as any);
        }
      }
    } catch (e: any) {
      console.error('Google Auth Error:', e);
      showToast({ type: 'error', message: e.message || 'Error logging in with Google' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      showToast({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }

    setLoading(true);
    setErrorVisible(false);

    // Assume identifier is email for now. Wait, supabase allows sign in with email
    let loginData = { email: identifier, password };
    const { data, error } = await supabase.auth.signInWithPassword(loginData);

    if (error) {
      setErrorVisible(true);
      setLoading(false);
      return;
    }

    // On Success: fetch profile and route
    try {
      const destination = await getPostAuthDestination(data.user);
      router.replace(destination as any);
    } catch {
      router.replace('/');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfacePage }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, justifyContent: 'center' }}>
          
          <View style={{ alignItems: 'center', marginBottom: spacing['3xl'] }}>
            <Text style={{ 
              fontSize: 26, 
              fontWeight: typography.weight.bold, 
              color: colors.actionPrimary,
              letterSpacing: -0.5,
            }}>
              zenzo
            </Text>
          </View>

          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{
              fontSize: typography.size['3xl'],
              fontWeight: typography.weight.bold,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}>
              Welcome back
            </Text>
            <Text style={{
              fontSize: typography.size.md,
              color: colors.textSecondary,
            }}>
              Sign in to your account.
            </Text>
          </View>

          {errorVisible && (
            <View style={{
              backgroundColor: `${colors.statusError}15`,
              borderColor: `${colors.statusError}40`,
              borderWidth: 1,
              borderRadius: 8,
              padding: spacing.md,
              marginBottom: spacing.lg,
            }}>
              <Text style={{ color: colors.statusError, fontSize: typography.size.sm }}>
                Invalid email or password.
              </Text>
            </View>
          )}

          <View style={{ gap: spacing.lg, marginBottom: spacing.xl }}>
            <Input
              label="Email or Phone"
              placeholder="you@example.com"
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            
            <View>
              <Input
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => router.push('/(auth)/forgot-password')}
                style={{ position: 'absolute', right: 0, top: 0, paddingRight: 4 }}
              >
                <Text style={{ color: colors.actionPrimary, fontSize: typography.size.sm, fontWeight: typography.weight.medium }}>
                  Forgot?
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button 
            title="Log In" 
            fullWidth 
            loading={loading} 
            disabled={googleLoading}
            onPress={handleLogin} 
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
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={{ color: colors.actionPrimary, fontWeight: typography.weight.semibold, fontSize: typography.size.md }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
