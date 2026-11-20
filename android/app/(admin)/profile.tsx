import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import {
  ShieldCheck,
  User,
  LogOut,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react-native';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { colors } = useThemeStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the admin console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text }]}>Admin Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <ShieldCheck size={36} color="#FFFFFF" />
          </View>
          <Text style={[typography.h2, { color: colors.text, marginTop: 12 }]}>
            {user?.full_name || 'System Administrator'}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {user?.email}
          </Text>
          <Badge label="PLATFORM ADMINISTRATOR" variant="primary" style={{ marginTop: 10 }} />
        </Card>

        {/* Console Actions */}
        <Card style={{ marginTop: 16 }}>
          <Text style={[typography.captionBold, { color: colors.textMuted, marginBottom: 12 }]}>
            CONSOLE SWITCHING
          </Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Layers size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                Switch to Student Dashboard
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Experience the mobile interface as a student
              </Text>
            </View>
            <ArrowRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Security & Logout */}
        <Card style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#DC2626" />
            <Text style={[typography.bodyBold, { color: '#DC2626', marginLeft: 12 }]}>
              Sign Out of Admin Console
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
