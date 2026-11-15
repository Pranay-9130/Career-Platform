import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import {
  User,
  GraduationCap,
  FileText,
  Moon,
  Sun,
  Smartphone,
  LogOut,
  HelpCircle,
  Info,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isDark, mode, setMode, colors } = useThemeStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your AspirePath account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text }]}>Student Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[typography.h3, { color: colors.text }]}>{user?.full_name || 'AspirePath Student'}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{user?.email}</Text>
              <Badge
                label={user?.role === 'ADMIN' ? 'Platform Administrator' : 'Verified Student'}
                variant="primary"
                style={{ marginTop: 6 }}
              />
            </View>
          </View>

          {/* Education Snippet */}
          <View style={[styles.educationSnippet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <GraduationCap size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.captionBold, { color: colors.text }]}>Computer Science & Engineering</Text>
              <Text style={[typography.tiny, { color: colors.textMuted }]}>Batch 2026 • Verified Student Profile</Text>
            </View>
          </View>
        </Card>

        {/* Career Tools Shortcuts */}
        <Text style={[typography.captionBold, { color: colors.textMuted, uppercase: true, marginBottom: 8, paddingHorizontal: 4 }]}>
          Career Workspaces
        </Text>

        <Card style={styles.menuCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/resume-builder')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
              <FileText size={18} color="#2563EB" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, flex: 1, marginLeft: 12 }]}>
              Resume Builder
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/ats-analyzer')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#ECFEFF' }]}>
              <Sparkles size={18} color="#06B6D4" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, flex: 1, marginLeft: 12 }]}>
              ATS Resume Analyzer
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/skill-intelligence')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#EEF2FF' }]}>
              <Layers size={18} color="#6366F1" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, flex: 1, marginLeft: 12 }]}>
              Skill Intelligence & Roadmaps
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/placement-prep')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#ECFDF5' }]}>
              <BookOpen size={18} color="#10B981" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, flex: 1, marginLeft: 12 }]}>
              Placement Preparation PDFs
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Preferences & Theme */}
        <Text style={[typography.captionBold, { color: colors.textMuted, uppercase: true, marginBottom: 8, marginTop: 12, paddingHorizontal: 4 }]}>
          Appearance & Settings
        </Text>

        <Card style={styles.menuCard}>
          <View style={styles.themeRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isDark ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color={colors.primary} />}
              <Text style={[typography.bodyBold, { color: colors.text, marginLeft: 12 }]}>
                Theme Mode
              </Text>
            </View>

            <View style={styles.themeToggleButtons}>
              {(['light', 'dark', 'system'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.7}
                  onPress={() => setMode(t)}
                  style={[
                    styles.themeBtn,
                    mode === t && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      typography.tiny,
                      { color: mode === t ? '#FFFFFF' : colors.textMuted, textTransform: 'capitalize' },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* App Info & Sign out */}
        <Card style={[styles.menuCard, { marginTop: 12 }]}>
          <View style={styles.menuItem}>
            <Info size={18} color={colors.textMuted} />
            <Text style={[typography.body, { color: colors.textSecondary, flex: 1, marginLeft: 12 }]}>
              AspirePath for Android
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>v1.0.0 (Release)</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.menuItem}>
            <LogOut size={18} color={colors.error} />
            <Text style={[typography.bodyBold, { color: colors.error, marginLeft: 12 }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 16,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
  },
  educationSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: 16,
  },
  menuCard: {
    padding: 4,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  themeToggleButtons: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 8,
  },
  themeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
