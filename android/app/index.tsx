import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { appStorage } from '../src/utils/storage';
import { APP_CONFIG } from '../src/constants/config';
import { useThemeStore } from '../src/store/themeStore';
import { typography } from '../src/constants/theme';
import { Sparkles } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colors } = useThemeStore();

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      if (isLoading) return;

      const onboardingDone = await appStorage.getItem(APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (!onboardingDone) {
        router.replace('/onboarding');
      } else if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Brand Icon */}
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoLetter}>A</Text>
        </View>

        {/* Brand Name */}
        <Text style={[typography.h1, { color: colors.text, marginTop: 16 }]}>
          Aspire<Text style={{ color: colors.primary }}>Path</Text>
        </Text>

        {/* Tagline */}
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 6, textAlign: 'center' }]}>
          From your first project to your first job.
        </Text>

        <View style={styles.badge}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={[typography.tiny, { color: colors.primary, marginLeft: 4 }]}>
            AI-Powered Career Intelligence
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    marginTop: 24,
  },
});
