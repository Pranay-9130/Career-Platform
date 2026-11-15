import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { appStorage } from '../src/utils/storage';
import { APP_CONFIG } from '../src/constants/config';
import { useThemeStore } from '../src/store/themeStore';
import { typography } from '../src/constants/theme';
import { Sparkles } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { colors } = useThemeStore();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      if (isLoading) return;

      const onboardingDone = await appStorage.getItem(APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (!onboardingDone) {
        router.replace('/onboarding');
      } else if (isAuthenticated) {
        if (user?.role === 'ADMIN') {
          router.replace('/(admin)' as any);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Authentic AspirePath Brand Logo */}
        <Image
          source={require('../assets/logo-original.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />

        {/* Official Tagline */}
        <Text style={[typography.bodyBold, styles.tagline]}>
          From your first project to your first job.
        </Text>

        <View style={styles.badge}>
          <Sparkles size={14} color="#2563EB" />
          <Text style={[typography.tiny, styles.badgeText]}>
            AI-Powered Career & Placement Intelligence
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
    width: '100%',
  },
  brandLogo: {
    width: 260,
    height: 70,
    marginBottom: 8,
  },
  tagline: {
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 20,
  },
  badgeText: {
    color: '#1D4ED8',
    marginLeft: 6,
    fontWeight: '700',
  },
});

