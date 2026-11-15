import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { initialize: initAuth } = useAuthStore();
  const { initializeTheme, isDark, colors } = useThemeStore();

  useEffect(() => {
    initAuth();
    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="tools/resume-builder" options={{ presentation: 'card' }} />
          <Stack.Screen name="tools/ats-analyzer" options={{ presentation: 'card' }} />
          <Stack.Screen name="tools/skill-intelligence" options={{ presentation: 'card' }} />
          <Stack.Screen name="tools/placement-prep" options={{ presentation: 'card' }} />
          <Stack.Screen name="jobs/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="projects/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

