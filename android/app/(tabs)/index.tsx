import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { jobsApi } from '../../src/api/jobsApi';
import { projectsApi } from '../../src/api/projectsApi';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import {
  FileText,
  Sparkles,
  BrainCircuit,
  BookOpen,
  ArrowRight,
  Bell,
  Briefcase,
  FolderGit2,
  CheckCircle2,
  ChevronRight,
  Target,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useThemeStore();

  const {
    data: jobs,
    isLoading: loadingJobs,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['home-jobs'],
    queryFn: () => jobsApi.getJobs(),
  });

  const {
    data: projects,
    isLoading: loadingProjects,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['home-projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  const {
    data: applications,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ['home-applications'],
    queryFn: () => jobsApi.getMyApplications(),
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchJobs(), refetchProjects(), refetchApps()]);
    setRefreshing(false);
  }, [refetchJobs, refetchProjects, refetchApps]);

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Student';
  const appsCount = applications?.length || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </View>
          <View>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Welcome back,</Text>
            <Text style={[typography.h4, { color: colors.text }]}>{user?.full_name || 'AspirePath Student'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.background }]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Bell size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Banner */}
        <View style={[styles.welcomeBanner, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Badge label="Career Readiness" variant="primary" />
            <Text style={[typography.h3, { color: colors.text, marginTop: 8 }]}>
              Hello, {firstName}!
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
              Your journey from your first project to your first tech job starts here.
            </Text>
          </View>
          <View style={[styles.progressCircle, { borderColor: colors.primary }]}>
            <Text style={[typography.h3, { color: colors.primary }]}>84%</Text>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>Ready</Text>
          </View>
        </View>

        {/* Career Readiness Metrics Grid */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Sparkles size={16} color={colors.accentCyan} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>ATS Score</Text>
            </View>
            <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>88<Text style={typography.caption}>/100</Text></Text>
            <Text style={[typography.tiny, { color: colors.success, marginTop: 2 }]}>✓ Verified Match</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Target size={16} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>Target Track</Text>
            </View>
            <Text style={[typography.h4, { color: colors.text, marginTop: 4 }]} numberOfLines={1}>Frontend</Text>
            <Text style={[typography.tiny, { color: colors.textMuted, marginTop: 2 }]}>12 Skills Active</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Briefcase size={16} color={colors.warning} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>Applications</Text>
            </View>
            <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>{appsCount}</Text>
            <Text style={[typography.tiny, { color: colors.textMuted, marginTop: 2 }]}>Active Pipeline</Text>
          </Card>
        </View>

        {/* Quick Action Career Tools */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text }]}>Core Career Tools</Text>
          <Text style={[typography.caption, { color: colors.primary }]}>Explore All</Text>
        </View>

        <View style={styles.toolsGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/tools/resume-builder')}
            style={[styles.toolCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <FileText size={22} color="#2563EB" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Resume Builder</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>ATS-optimized resumes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/tools/ats-analyzer')}
            style={[styles.toolCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: '#ECFEFF' }]}>
              <Sparkles size={22} color="#06B6D4" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>ATS Analyzer</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>Score & match checks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/tools/skill-intelligence')}
            style={[styles.toolCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: '#EEF2FF' }]}>
              <BrainCircuit size={22} color="#6366F1" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Skill Intelligence</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>Role gaps & roadmaps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/tools/placement-prep')}
            style={[styles.toolCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: '#ECFDF5' }]}>
              <BookOpen size={22} color="#10B981" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Placement Prep</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>Role-based PDF library</Text>
          </TouchableOpacity>
        </View>

        {/* Recommended Opportunities */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: colors.text }]}>Recommended Opportunities</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
            <Text style={[typography.captionBold, { color: colors.primary }]}>View All Jobs</Text>
          </TouchableOpacity>
        </View>

        {loadingJobs ? (
          <View style={{ gap: 8 }}>
            <Skeleton height={80} borderRadiusVal={12} />
            <Skeleton height={80} borderRadiusVal={12} />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {(jobs || []).slice(0, 3).map((job) => (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/jobs/${job.id}` as any)}
              >
                <Card style={styles.jobItemCard}>
                  <View style={styles.jobItemHeader}>
                    <View style={styles.jobCompanyLogo}>
                      <Briefcase size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textMuted }]}>
                        {job.company_name} • {job.location}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>

                  <View style={styles.jobItemFooter}>
                    <Badge label={job.job_type} variant="neutral" />
                    {job.stipend_or_salary ? (
                      <Text style={[typography.captionBold, { color: colors.primary }]}>
                        {job.stipend_or_salary}
                      </Text>
                    ) : null}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recommended Projects Showcase */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[typography.h4, { color: colors.text }]}>Explore Peer Projects</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/projects')}>
            <Text style={[typography.captionBold, { color: colors.primary }]}>Explore All</Text>
          </TouchableOpacity>
        </View>

        {loadingProjects ? (
          <View style={{ gap: 8 }}>
            <Skeleton height={70} borderRadiusVal={12} />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {(projects || []).slice(0, 2).map((proj) => (
              <TouchableOpacity
                key={proj.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/projects/${proj.id}` as any)}
              >
                <Card style={styles.projectItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                      {proj.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
                      {proj.tagline || proj.description}
                    </Text>
                  </View>
                  <Badge label={`${proj.stars_count} ★`} variant="warning" />
                </Card>
              </TouchableOpacity>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    marginBottom: 0,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  toolCard: {
    width: '48.5%',
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  toolIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobItemCard: {
    padding: 14,
    marginBottom: 0,
  },
  jobItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobCompanyLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  projectItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 0,
  },
});
