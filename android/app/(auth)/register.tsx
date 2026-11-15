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
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/authApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { User, Mail, Lock, AlertCircle, GraduationCap, Briefcase } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { colors } = useThemeStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'CONTRIBUTOR'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await authApi.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
      });

      if (res.access_token && res.user) {
        await setAuth(res.user, res.access_token);
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Unexpected registration response from server.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      const detail = err.response?.data?.detail;
      setErrorMessage(typeof detail === 'string' ? detail : 'Registration failed. This email may already be registered.');
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={[typography.h2, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[typography.body, { color: colors.textMuted, marginTop: 4, textAlign: 'center' }]}>
              Join AspirePath and accelerate your career readiness
            </Text>
          </View>

          {/* Role Selection Tabs */}
          <View style={[styles.roleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedRole('STUDENT')}
              style={[
                styles.roleTab,
                selectedRole === 'STUDENT' && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
            >
              <GraduationCap
                size={18}
                color={selectedRole === 'STUDENT' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedRole === 'STUDENT' ? colors.primary : colors.textMuted, marginTop: 4 },
                ]}
              >
                College Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedRole('CONTRIBUTOR')}
              style={[
                styles.roleTab,
                selectedRole === 'CONTRIBUTOR' && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
            >
              <Briefcase
                size={18}
                color={selectedRole === 'CONTRIBUTOR' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedRole === 'CONTRIBUTOR' ? colors.primary : colors.textMuted, marginTop: 4 },
                ]}
              >
                Job Seeker
              </Text>
            </TouchableOpacity>
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
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChangeText={setFullName}
              leftIcon={<User size={18} color={colors.textMuted} />}
            />

            <Input
              label="Email Address"
              placeholder="e.g. alex@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password (min. 8 characters)"
              placeholder="••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Login Link */}
          <View style={styles.footerRow}>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>
                Sign In
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
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: 6,
    marginBottom: 20,
    gap: 8,
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
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
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
});
