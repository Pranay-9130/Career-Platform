import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/authApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { colors } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await authApi.login(email.trim().toLowerCase(), password);
      if (res.access_token && res.user) {
        await setAuth(res.user, res.access_token);
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Unexpected response from server.');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const detail = err.response?.data?.detail;
      setErrorMessage(typeof detail === 'string' ? detail : 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoLetter}>A</Text>
            </View>
            <Text style={[typography.h2, { color: colors.text, marginTop: 16 }]}>
              Welcome Back
            </Text>
            <Text style={[typography.body, { color: colors.textMuted, marginTop: 4 }]}>
              Sign in to your AspirePath student workspace
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
              <AlertCircle size={16} color={colors.error} />
              <Text style={[typography.caption, { color: colors.error, marginLeft: 8, flex: 1 }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="e.g. student@college.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={[typography.captionBold, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Register Footer Link */}
          <View style={styles.footerRow}>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 20,
  },
  form: {
    marginBottom: 24,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});

