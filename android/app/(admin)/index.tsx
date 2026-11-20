import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminStats } from '../../src/api/adminApi';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import {
  ShieldCheck,
  Users,
  Briefcase,
  FolderGit2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { colors } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Admin Stats
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
  });

  // Fetch Pending Projects Queue
  const { data: pendingQueue, isLoading: loadingQueue, refetch: refetchQueue } = useQuery({
    queryKey: ['admin-pending-queue'],
    queryFn: () => adminApi.getModerationQueue('Submitted', 5),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchQueue()]);
    setRefreshing(false);
  }, [refetchStats, refetchQueue]);

  // Project Moderation Mutation
  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      adminApi.moderateProject(id, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert(
        'Action Recorded',
        `Project submission has been ${variables.action === 'approve' ? 'approved & published' : 'rejected'}.`
      );
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update project status.');
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Admin Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Badge label="ADMIN" variant="primary" style={styles.roleBadge} />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={[typography.captionBold, { color: colors.primary }]}>Student View</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Admin Welcome Banner */}
        <View style={[styles.welcomeBanner, { backgroundColor: '#1E3A8A' }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.adminTitleRow}>
              <ShieldCheck size={20} color="#93C5FD" />
              <Text style={[typography.h3, { color: '#FFFFFF', marginLeft: 8 }]}>
                Admin Console
              </Text>
            </View>
            <Text style={[typography.caption, { color: '#BFDBFE', marginTop: 4, lineHeight: 18 }]}>
              Logged in as {user?.full_name || 'Administrator'} ({user?.email})
            </Text>
          </View>
        </View>

        {/* Real-time KPI Stats Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text }]}>Platform Operations Overview</Text>
        </View>

        {loadingStats ? (
          <View style={styles.statsGrid}>
            <Skeleton height={80} style={{ flex: 1 }} borderRadiusVal={12} />
            <Skeleton height={80} style={{ flex: 1 }} borderRadiusVal={12} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Users size={18} color="#2563EB" />
                <Text style={[typography.caption, { color: colors.textMuted }]}>Students</Text>
              </View>
              <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>
                {stats?.total_students ?? 0}
              </Text>
              <Text style={[typography.tiny, { color: colors.success, marginTop: 2 }]}>
                Active Registrations
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Briefcase size={18} color="#059669" />
                <Text style={[typography.caption, { color: colors.textMuted }]}>Job Postings</Text>
              </View>
              <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>
                {stats?.total_jobs ?? 0}
              </Text>
              <Text style={[typography.tiny, { color: colors.textSecondary, marginTop: 2 }]}>
                Platform Opportunities
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Clock size={18} color="#D97706" />
                <Text style={[typography.caption, { color: colors.textMuted }]}>Queue</Text>
              </View>
              <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>
                {stats?.pending_submissions ?? 0}
              </Text>
              <Text style={[typography.tiny, { color: colors.warning, marginTop: 2 }]}>
                Pending Review
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <FolderGit2 size={18} color="#7C3AED" />
                <Text style={[typography.caption, { color: colors.textMuted }]}>Published</Text>
              </View>
              <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>
                {stats?.published_projects ?? 0}
              </Text>
              <Text style={[typography.tiny, { color: colors.primary, marginTop: 2 }]}>
                Approved Projects
              </Text>
            </Card>
          </View>
        )}

        {/* Quick Actions Hub */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text }]}>Administrative Control Hub</Text>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            onPress={() => router.push('/(admin)/jobs')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Briefcase size={22} color="#059669" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>Jobs Manager</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Add, edit & publish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            onPress={() => router.push('/(admin)/projects')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={22} color="#D97706" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>Project Queue</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Moderate student code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            onPress={() => router.push('/(admin)/students')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Users size={22} color="#2563EB" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>Student Directory</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Inspect accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            onPress={() => router.push('/tools/placement-prep')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F5F3FF' }]}>
              <FolderGit2 size={22} color="#7C3AED" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>Study Materials</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>PDF guide catalog</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Review Submissions Feed */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text }]}>Pending Student Submissions</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/projects')}>
            <Text style={[typography.captionBold, { color: colors.primary }]}>View All ({stats?.pending_submissions ?? 0})</Text>
          </TouchableOpacity>
        </View>

        {loadingQueue ? (
          <Skeleton height={100} borderRadiusVal={12} />
        ) : !pendingQueue || pendingQueue.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CheckCircle2 size={32} color={colors.success} />
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>
              Queue Clean
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, textAlign: 'center' }]}>
              No student submissions pending moderation right now.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {pendingQueue.map((item: any) => (
              <Card key={item.id} style={styles.queueItemCard}>
                <View style={styles.queueItemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                      By {item.owner?.full_name || 'Student'} • {item.domain || 'Software Engineering'}
                    </Text>
                  </View>
                  <Badge label="Needs Review" variant="warning" />
                </View>

                {item.tagline ? (
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={2}>
                    {item.tagline}
                  </Text>
                ) : null}

                <View style={styles.queueActionsRow}>
                  <TouchableOpacity
                    style={[styles.moderationBtn, { backgroundColor: '#DC2626' }]}
                    onPress={() => moderateMutation.mutate({ id: item.id, action: 'reject' })}
                    disabled={moderateMutation.isPending}
                  >
                    <Text style={styles.moderationBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.moderationBtn, { backgroundColor: '#059669' }]}
                    onPress={() => moderateMutation.mutate({ id: item.id, action: 'approve' })}
                    disabled={moderateMutation.isPending}
                  >
                    <Text style={styles.moderationBtnText}>Approve & Publish</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 130,
    height: 34,
  },
  roleBadge: {
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  welcomeBanner: {
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 20,
  },
  adminTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '48.5%',
    padding: 12,
    marginBottom: 0,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    width: '48.5%',
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueItemCard: {
    padding: 14,
    marginBottom: 0,
  },
  queueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  moderationBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moderationBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
