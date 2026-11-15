import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../../src/api/jobsApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import {
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  Bookmark,
  Share2,
  DollarSign,
  GraduationCap,
} from 'lucide-react-native';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemeStore();

  const [applied, setApplied] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', id],
    queryFn: () => jobsApi.getJobById(id!),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: () => jobsApi.applyToJob(id!),
    onSuccess: () => {
      setApplied(true);
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      Alert.alert(
        'Application Submitted!',
        'Your profile and ATS resume have been forwarded directly to the hiring team.'
      );
    },
    onError: (err: any) => {
      Alert.alert('Application Status', err.response?.data?.detail || 'Application already recorded.');
    },
  });

  if (isLoading || !job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Opportunity Details" />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={180} borderRadiusVal={16} />
          <Skeleton height={140} borderRadiusVal={16} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Header
        title={job.title}
        subtitle={job.company_name}
        rightAction={
          <TouchableOpacity onPress={() => Alert.alert('Share', `Sharing ${job.title} at ${job.company_name}`)}>
            <Share2 size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Hero Card */}
        <Card>
          <View style={styles.companyRow}>
            <View style={styles.companyIcon}>
              <Briefcase size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[typography.h3, { color: colors.text }]}>{job.title}</Text>
              <Text style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}>
                {job.company_name}
              </Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <Badge label={job.job_type} variant="primary" />
            <Badge label={job.work_mode} variant="neutral" />
            <Badge label={job.domain} variant="warning" />
          </View>

          <View style={[styles.quickFactsRow, { borderTopColor: colors.borderLight }]}>
            <View style={styles.factItem}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                {job.location}
              </Text>
            </View>

            {job.stipend_or_salary ? (
              <Text style={[typography.bodyBold, { color: colors.primary }]}>
                {job.stipend_or_salary}
              </Text>
            ) : null}
          </View>
        </Card>

        {/* Eligibility Details */}
        <Card>
          <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
            Eligibility & Criteria
          </Text>

          <View style={styles.criteriaItem}>
            <Text style={[typography.captionBold, { color: colors.textSecondary }]}>Eligible Batches:</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              {job.eligible_batches && job.eligible_batches.length > 0
                ? job.eligible_batches.join(', ')
                : 'All Graduation Batches'}
            </Text>
          </View>

          <View style={[styles.criteriaItem, { marginTop: 10 }]}>
            <Text style={[typography.captionBold, { color: colors.textSecondary }]}>Degree Qualifications:</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              {job.eligible_qualifications && job.eligible_qualifications.length > 0
                ? job.eligible_qualifications.join(', ')
                : 'B.Tech / B.E / BCA / MCA / M.Tech in CS, IT or related fields'}
            </Text>
          </View>
        </Card>

        {/* Description */}
        <Card>
          <Text style={[typography.h4, { color: colors.text, marginBottom: 10 }]}>
            Role Description
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {job.description || 'Join our engineering organization to build high-performance distributed systems.'}
          </Text>
        </Card>

        {/* Skills Required */}
        {job.skills_required && job.skills_required.length > 0 && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
              Required Competencies
            </Text>
            <View style={styles.skillsWrap}>
              {job.skills_required.map((s) => (
                <Badge key={s} label={s} variant="primary" />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Sticky Apply Bar */}
      <View style={[styles.applyBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          title={applied ? '✓ Application Submitted' : 'Submit Application'}
          onPress={() => applyMutation.mutate()}
          loading={applyMutation.isPending}
          disabled={applied}
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  quickFactsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaItem: {
    paddingVertical: 4,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  applyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
});

