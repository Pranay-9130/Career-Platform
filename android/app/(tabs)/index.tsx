import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { jobsApi } from '../../src/api/jobsApi';
import { projectsApi } from '../../src/api/projectsApi';
import { Job, Project } from '../../src/types';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import {
  Bell,
  Sparkles,
  Target,
  Briefcase,
  FileText,
  BrainCircuit,
  BookOpen,
  FolderGit2,
  ChevronRight,
  ShieldCheck,
  Send,
  ArrowRight,
  MapPin,
  TrendingUp,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useThemeStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: jobs, isLoading: loadingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: () => jobsApi.getJobs(),
  });

  const { data: projects, isLoading: loadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: ['featured-projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  const { data: applications, refetch: refetchApps } = useQuery({
    queryKey: ['my-applications-count'],
    queryFn: () => jobsApi.getMyApplications(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchJobs(), refetchProjects(), refetchApps()]);
    setRefreshing(false);
  }, [refetchJobs, refetchProjects, refetchApps]);

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Student';
  const jobsList: Job[] = Array.isArray(jobs) ? jobs : (jobs as any)?.items || [];
  const projectsList: Project[] = Array.isArray(projects) ? projects : (projects as any)?.items || [];
  const applicationsList = Array.isArray(applications) ? applications : (applications as any)?.items || [];
  const appsCount = applicationsList.length;

  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;
  const columns = isTablet ? 3 : 2;
  const gridGap = 12;
  const horizontalPadding = 32;
  const cardWidth = Math.floor((windowWidth - horizontalPadding - (gridGap * (columns - 1))) / columns);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header with Exact Brand Logo & Profile */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerRight}>
          {user?.role === 'ADMIN' && (
            <TouchableOpacity
              style={styles.adminPill}
              onPress={() => router.push('/(admin)' as any)}
              activeOpacity={0.7}
            >
              <ShieldCheck size={14} color="#FFFFFF" />
              <Text style={styles.adminPillText}>Admin</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Bell size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Banner Card */}
        <View style={[styles.welcomeBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={styles.badgeRow}>
              <Badge label="Career Readiness" variant="primary" />
              <Badge label="AI Active" variant="success" />
            </View>
            <Text style={[typography.h2, { color: '#0F172A', marginTop: 8 }]}>
              Hello, {firstName}!
            </Text>
            <Text style={[typography.caption, { color: '#475569', marginTop: 4, lineHeight: 18 }]}>
              From your first project to your first tech job starts here.
            </Text>
          </View>

          {/* Readiness Circle Progress */}
          <View style={[styles.readinessCircle, { borderColor: '#2563EB', backgroundColor: '#FFFFFF' }]}>
            <Text style={[typography.h3, { color: '#2563EB', fontWeight: '800' }]}>84%</Text>
            <Text style={[typography.tiny, { color: '#64748B' }]}>Ready</Text>
          </View>
        </View>

        {/* Compact Responsive Statistics Grid */}
        <View style={styles.statsRow}>
          <Card style={styles.statMiniCard}>
            <View style={styles.statHeader}>
              <Sparkles size={16} color="#06B6D4" />
              <Text style={[typography.caption, { color: colors.textMuted }]}>ATS Score</Text>
            </View>
            <Text style={[typography.h3, { color: colors.text, marginTop: 4 }]}>
              88<Text style={typography.caption}>/100</Text>
            </Text>
            <Text style={[typography.tiny, { color: colors.success, marginTop: 2 }]}>
              ✓ Verified Match
            </Text>
          </Card>

          <Card style={styles.statMiniCard}>
            <View style={styles.statHeader}>
              <Target size={16} color="#2563EB" />
              <Text style={[typography.caption, { color: colors.textMuted }]}>Target Track</Text>
            </View>
            <Text style={[typography.h4, { color: colors.text, marginTop: 4 }]} numberOfLines={1}>
              Frontend
            </Text>
            <Text style={[typography.tiny, { color: colors.primary, marginTop: 2 }]}>
              12 Skills Active
            </Text>
          </Card>

          <Card style={styles.statMiniCard}>
            <View style={styles.statHeader}>
              <Send size={16} color="#D97706" />
              <Text style={[typography.caption, { color: colors.textMuted }]}>Applied</Text>
            </View>
            <Text style={[typography.h3, { color: colors.text, marginTop: 4 }]}>
              {appsCount}
            </Text>
            <Text style={[typography.tiny, { color: colors.textMuted, marginTop: 2 }]}>
              Active Pipeline
            </Text>
          </Card>
        </View>

        {/* Core Career Tools Section (Responsive 2-Column Grid) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[typography.h3, { color: colors.text }]}>Core Career Tools</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              End-to-end recruitment acceleration
            </Text>
          </View>
        </View>

        <View style={styles.toolsGrid}>
          {/* Resume Builder */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/resume-builder')}
            style={[styles.toolCard, { width: cardWidth, backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#EFF6FF' }]}>
              <FileText size={22} color="#2563EB" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Resume Builder</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>ATS-optimized resumes</Text>
          </TouchableOpacity>

          {/* ATS Analyzer */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/ats-analyzer')}
            style={[styles.toolCard, { width: cardWidth, backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#ECFEFF' }]}>
              <Sparkles size={22} color="#06B6D4" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>ATS Analyzer</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>Job description match</Text>
          </TouchableOpacity>

          {/* Skill Intelligence */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/skill-intelligence')}
            style={[styles.toolCard, { width: cardWidth, backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#EEF2FF' }]}>
              <BrainCircuit size={22} color="#6366F1" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Skill Intelligence</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>Resume extraction & gaps</Text>
          </TouchableOpacity>

          {/* Placement Prep */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/tools/placement-prep')}
            style={[styles.toolCard, { width: cardWidth, backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#ECFDF5' }]}>
              <BookOpen size={22} color="#10B981" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Placement Prep</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>Role question guides</Text>
          </TouchableOpacity>

          {/* Explore Jobs */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/jobs')}
            style={[styles.toolCard, { width: cardWidth, backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Briefcase size={22} color="#D97706" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Explore Jobs</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>Verified openings & links</Text>
          </TouchableOpacity>

          {/* Peer Projects */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/projects')}
            style={[styles.toolCard, { width: cardWidth, backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#F5F3FF' }]}>
              <FolderGit2 size={22} color="#7C3AED" />
            </View>
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 10 }]}>Peer Projects</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>Code reviews & demos</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Opportunities Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[typography.h3, { color: colors.text }]}>Featured Opportunities</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Matching your target career track
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
            <Text style={[typography.captionBold, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingJobs ? (
          <View style={{ gap: 10, marginBottom: 24 }}>
            <Skeleton height={90} borderRadiusVal={12} />
            <Skeleton height={90} borderRadiusVal={12} />
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 24 }}>
            {jobsList.slice(0, 3).map((job: Job) => (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/jobs/${job.id}` as any)}
              >
                <Card style={styles.jobItemCard}>
                  <View style={styles.jobItemHeader}>
                    <View style={styles.jobCompanyLogo}>
                      <Briefcase size={18} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textMuted }]}>
                        {job.company_name} • {job.location || 'Remote'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>

                  <View style={styles.jobItemFooter}>
                    <Badge label={job.job_type || 'Full-time'} variant="neutral" />
                    {job.eligible_batches && job.eligible_batches.length > 0 ? (
                      <Badge label={`Batch: ${job.eligible_batches[0]}`} variant="primary" />
                    ) : null}
                    <Text style={[typography.captionBold, { color: colors.primary }]}>
                      {job.stipend_or_salary || 'Salary Disclosed'}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Peer Projects Showcase */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[typography.h3, { color: colors.text }]}>Explore Peer Projects</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Verified code by students
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/projects')}>
            <Text style={[typography.captionBold, { color: colors.primary }]}>Explore All</Text>
          </TouchableOpacity>
        </View>

        {loadingProjects ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={80} borderRadiusVal={12} />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {projectsList.slice(0, 2).map((proj: Project) => (
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
                  <Badge label={`${proj.stars_count ?? 0} ★`} variant="warning" />
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  adminPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  readinessCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statMiniCard: {
    flex: 1,
    padding: 12,
    marginBottom: 0,
  },
  statHeader: {
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
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 24,
  },
  toolCard: {
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIconBox: {
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
    width: 38,
    height: 38,
    borderRadius: 10,
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
