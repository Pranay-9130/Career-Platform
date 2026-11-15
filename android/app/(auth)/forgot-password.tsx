import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/authApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to submit reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[typography.h2, { color: colors.text }]}>Reset Password</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 6 }]}>
            Enter the email associated with your AspirePath account and we'll send password recovery instructions.
          </Text>
        </View>

        {success ? (
          <View style={[styles.successBox, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <CheckCircle2 size={24} color={colors.success} />
            <Text style={[typography.bodyBold, { color: colors.success, marginTop: 8 }]}>
              Check Your Inbox
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
              If an account exists for {email}, recovery instructions have been dispatched.
            </Text>
            <Button
              title="Return to Sign In"
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: 16, width: '100%' }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                <AlertCircle size={16} color={colors.error} />
                <Text style={[typography.caption, { color: colors.error, marginLeft: 8, flex: 1 }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            <Input
              label="Email Address"
              placeholder="e.g. student@college.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <Button
              title="Send Recovery Link"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 28,
  },
  form: {
    width: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  successBox: {
    padding: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
});

