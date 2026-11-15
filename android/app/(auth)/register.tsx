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
import { authApi } from '../../src/api/authApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import {
  User,
  Mail,
  Lock,
  Phone,
  School,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Briefcase,
} from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'CONTRIBUTOR'>('STUDENT');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field-specific validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    collegeName?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneClean = mobileNumber.replace(/\D/g, '');

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required.';
    } else if (phoneClean.length < 10) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (!collegeName.trim() || collegeName.trim().length < 2) {
      newErrors.collegeName = 'College / University name is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (loading) return; // Prevent multiple submissions

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      setErrorMessage('Please review the errors highlighted below.');
      return;
    }

    try {
      setLoading(true);

      // SECURITY REQUIREMENT:
      // Confirm Password is a frontend validation field only.
      // It is NOT stored or sent to the backend.
      // We pass the official UserCreate contract: { email, password, full_name, role, headline }
      const headline = collegeName.trim()
        ? `Student at ${collegeName.trim()}`
        : 'AspirePath Student';

      const res = await authApi.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: selectedRole,
        headline: headline,
      });

      if (res && (res.access_token || res.user)) {
        setSuccessMessage('Account registered successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1500);
      } else {
        setErrorMessage('Unexpected registration response from server.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (!err.response) {
        setErrorMessage('Unable to reach server. Please check your internet connection.');
      } else {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
          setErrorMessage(detail);
        } else if (Array.isArray(detail)) {
          setErrorMessage(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '));
        } else {
          setErrorMessage('Registration failed. An account with this email may already exist.');
        }
      }
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
            <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
              <GraduationCap size={28} color={colors.primary} />
            </View>
            <Text style={[typography.h2, { color: colors.text, marginTop: 12 }]}>
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
              disabled={loading}
              onPress={() => setSelectedRole('STUDENT')}
              style={[
                styles.roleTab,
                selectedRole === 'STUDENT' && {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                },
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
              disabled={loading}
              onPress={() => setSelectedRole('CONTRIBUTOR')}
              style={[
                styles.roleTab,
                selectedRole === 'CONTRIBUTOR' && {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                },
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

          {/* Success Banner */}
          {successMessage && (
            <View style={[styles.alertBox, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
              <CheckCircle2 size={18} color="#10B981" />
              <Text style={[typography.captionBold, { color: '#047857', marginLeft: 8, flex: 1 }]}>
                {successMessage}
              </Text>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <View style={[styles.alertBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
              <AlertCircle size={18} color={colors.error} />
              <Text style={[typography.caption, { color: colors.error, marginLeft: 8, flex: 1 }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Registration Form */}
          <View style={styles.form}>
            {/* 1. Full Name */}
            <Input
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              editable={!loading}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              error={errors.fullName}
              leftIcon={<User size={18} color={colors.textMuted} />}
            />

            {/* 2. Email Address */}
            <Input
              label="Email Address"
              placeholder="e.g. alex@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            {/* 3. Mobile Number */}
            <Input
              label="Mobile Number"
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              editable={!loading}
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: undefined }));
              }}
              error={errors.mobileNumber}
              leftIcon={<Phone size={18} color={colors.textMuted} />}
            />

            {/* 4. College Name */}
            <Input
              label="College / University Name"
              placeholder="e.g. Stanford University"
              editable={!loading}
              value={collegeName}
              onChangeText={(text) => {
                setCollegeName(text);
                if (errors.collegeName) setErrors((prev) => ({ ...prev, collegeName: undefined }));
              }}
              error={errors.collegeName}
              leftIcon={<School size={18} color={colors.textMuted} />}
            />

            {/* 5. Password */}
            <Input
              label="Password (min. 8 characters)"
              placeholder="••••••••"
              isPassword
              editable={!loading}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                if (confirmPassword && text !== confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
                } else if (confirmPassword && text === confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              error={errors.password}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
            />

            {/* 6. Confirm Password */}
            <Input
              label="Confirm Password"
              placeholder="••••••••"
              isPassword
              editable={!loading}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (!text) {
                  setErrors((prev) => ({ ...prev, confirmPassword: 'Confirm Password is required.' }));
                } else if (text !== password) {
                  setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
                } else {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              error={errors.confirmPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
            />

            {/* 7. Register Button */}
            <Button
              title={loading ? 'Creating Account...' : 'Register Account'}
              onPress={handleRegister}
              loading={loading}
              disabled={loading || !!successMessage}
              size="lg"
              style={{ marginTop: 12 }}
            />
          </View>

          {/* Login Footer Link */}
          <View style={styles.footerRow}>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity disabled={loading} onPress={() => router.push('/(auth)/login')}>
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
    paddingTop: 28,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
});
