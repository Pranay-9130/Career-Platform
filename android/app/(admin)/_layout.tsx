import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { ShieldCheck, Briefcase, FolderGit2, Users, User } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function AdminTabsLayout() {
  const { colors } = useThemeStore();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Console',
          tabBarIcon: ({ color, size }) => <ShieldCheck size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Manage Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Review Queue',
          tabBarIcon: ({ color, size }) => <FolderGit2 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, size }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Admin ID',
          tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
