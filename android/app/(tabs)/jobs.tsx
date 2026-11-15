import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../../src/api/jobsApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import { EmptyState } from '../../src/components/common/EmptyState';
import {
  Search,
  Briefcase,
  MapPin,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react-native';

const JOB_TYPE_FILTERS = ['All Types', 'Internship', 'Full-time', 'Contract'];
const WORK_MODE_FILTERS = ['All Modes', 'Remote', 'Hybrid', 'Onsite'];

export default function JobsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('All Types');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All Modes');

  const {
    data: jobs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['jobs-list'],
    queryFn: () => jobsApi.getJobs(),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.bookmarkJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs-list'] });
    },
  });

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      if (selectedJobType !== 'All Types' && job.job_type !== selectedJobType) return false;
      if (selectedWorkMode !== 'All Modes' && job.work_mode !== selectedWorkMode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchCompany = job.company_name.toLowerCase().includes(q);
        const matchSkills = job.skills_required?.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchCompany && !matchSkills) return false;
      }
      return true;
    });
  }, [jobs, selectedJobType, selectedWorkMode, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header & Search */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: 12 }]}>
          Jobs & Internships
        </Text>

        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search roles, companies, or tech skills..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, typography.body, { color: colors.text }]}
          />
        </View>

        {/* Filter Chips Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {JOB_TYPE_FILTERS.map((t) => (
            <TouchableOpacity
              key={t}
              activeOpacity={0.7}
              onPress={() => setSelectedJobType(t)}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedJobType === t ? colors.primary : colors.background,
                  borderColor: selectedJobType === t ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedJobType === t ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={[styles.chipDivider, { backgroundColor: colors.border }]} />

          {WORK_MODE_FILTERS.map((m) => (
            <TouchableOpacity
              key={m}
              activeOpacity={0.7}
              onPress={() => setSelectedWorkMode(m)}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedWorkMode === m ? colors.primary : colors.background,
                  borderColor: selectedWorkMode === m ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedWorkMode === m ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={140} borderRadiusVal={16} />
            <Skeleton height={140} borderRadiusVal={16} />
            <Skeleton height={140} borderRadiusVal={16} />
          </View>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={28} color={colors.primary} />}
            title="No Opportunities Found"
            description="Try adjusting your keyword search or active filter chips to discover matching openings."
            actionTitle="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedJobType('All Types');
              setSelectedWorkMode('All Modes');
            }}
          />
        ) : (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/jobs/${job.id}` as any)}
            >
              <Card style={styles.jobCard}>
                <View style={styles.jobTopRow}>
                  <View style={styles.jobLeftCol}>
                    <View style={styles.companyAvatar}>
                      <Briefcase size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 1 }]}>
                        {job.company_name}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => bookmarkMutation.mutate(job.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Bookmark
                      size={20}
                      color={job.is_bookmarked ? colors.primary : colors.textMuted}
                      fill={job.is_bookmarked ? colors.primary : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Location & Compensation */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <MapPin size={13} color={colors.textMuted} />
                    <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                      {job.location} ({job.work_mode})
                    </Text>
                  </View>

                  {job.stipend_or_salary ? (
                    <Text style={[typography.captionBold, { color: colors.primary }]}>
                      {job.stipend_or_salary}
                    </Text>
                  ) : null}
                </View>

                {/* Eligibility Badges */}
                {job.eligible_batches && job.eligible_batches.length > 0 && (
                  <View style={styles.eligibilityRow}>
                    <Text style={[typography.tiny, { color: colors.textMuted }]}>Batches:</Text>
                    {job.eligible_batches.slice(0, 3).map((b) => (
                      <Badge key={b} label={b} variant="neutral" />
                    ))}
                  </View>
                )}

                {/* Required Skills Chips */}
                {job.skills_required && job.skills_required.length > 0 && (
                  <View style={styles.skillsRow}>
                    {job.skills_required.slice(0, 4).map((skill) => (
                      <View key={skill} style={[styles.skillChip, { backgroundColor: colors.background }]}>
                        <Text style={[typography.tiny, { color: colors.textSecondary }]}>{skill}</Text>
                      </View>
                    ))}
                    {job.skills_required.length > 4 && (
                      <Text style={[typography.tiny, { color: colors.primary }]}>
                        +{job.skills_required.length - 4} more
                      </Text>
                    )}
                  </View>
                )}

                {/* Card CTA Row */}
                <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                  <Badge label={job.job_type} variant="primary" />
                  <View style={styles.viewActionRow}>
                    <Text style={[typography.captionBold, { color: colors.primary, marginRight: 4 }]}>
                      View Details
                    </Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
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
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterScroll: {
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  jobCard: {
    padding: 16,
    marginBottom: 12,
  },
  jobTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  jobLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  companyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  viewActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

