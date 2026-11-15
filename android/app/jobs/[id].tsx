import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../../src/api/jobsApi';
import { adminApi } from '../../src/api/adminApi';
import { useAuthStore } from '../../src/store/authStore';
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
  Share2,
  ExternalLink,
  Building,
  GraduationCap,
  Users,
  Clock,
  Trash2,
  ShieldCheck,
  Send,
} from 'lucide-react-native';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
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
      queryClient.invalidateQueries({ queryKey: ['my-applications-count'] });
    },
    onError: () => {
      // Still allow external apply even if platform tracking returns error
      setApplied(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs-list'] });
      Alert.alert('Deleted', 'Opportunity removed successfully from database.');
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to delete job.');
    },
  });

  const handleApply = async () => {
    applyMutation.mutate();

    const targetUrl = job?.apply_url || (job as any)?.application_url;
    if (targetUrl) {
      try {
        const canOpen = await Linking.canOpenURL(targetUrl);
        if (canOpen) {
          await Linking.openURL(targetUrl);
        } else {
          Alert.alert('Notice', `Application portal URL: ${targetUrl}`);
        }
      } catch {
        Alert.alert('Notice', `Please open the application link in your browser: ${targetUrl}`);
      }
    } else {
      Alert.alert(
        'Application Recorded',
        `Your application for ${job?.title} at ${job?.company_name} has been submitted on AspirePath.`
      );
    }
  };

  const confirmAdminDelete = () => {
    Alert.alert(
      'Admin Action: Delete Job',
      `Are you sure you want to delete "${job?.title}"? This permanently removes the job for all students.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (isLoading || !job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
          <TouchableOpacity
            onPress={() => Alert.alert('Share Opportunity', `AspirePath Opportunity:\n${job.title} at ${job.company_name}\n${job.apply_url || 'https://aspirepath.vercel.app/jobs'}`)}
            style={{ padding: 6 }}
          >
            <Share2 size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Admin Bar if Administrator */}
        {user?.role === 'ADMIN' && (
          <View style={styles.adminBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <ShieldCheck size={18} color="#1E3A8A" />
              <Text style={styles.adminBarText}>Administrator Mode</Text>
            </View>
            <TouchableOpacity
              style={styles.adminDeleteBtn}
              onPress={confirmAdminDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={16} color="#DC2626" />
              <Text style={styles.adminDeleteBtnText}>Delete Job</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Header Hero Card */}
        <Card>
          <View style={styles.companyRow}>
            <View style={styles.companyIcon}>
              <Briefcase size={26} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[typography.h3, { color: colors.text }]}>{job.title}</Text>
              <Text style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}>
                {job.company_name}
              </Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <Badge label={job.job_type || 'Full-time'} variant="primary" />
            <Badge label={job.work_mode || 'Remote'} variant="neutral" />
            <Badge label={job.domain || 'Engineering'} variant="warning" />
          </View>

          <View style={[styles.quickFactsRow, { borderTopColor: colors.borderLight }]}>
            <View style={styles.factItem}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                {job.location || 'Remote'}
              </Text>
            </View>

            {job.stipend_or_salary ? (
              <Text style={[typography.bodyBold, { color: colors.primary }]}>
                {job.stipend_or_salary}
              </Text>
            ) : (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Salary Disclosed
              </Text>
            )}
          </View>
        </Card>

        {/* Detailed Eligibility & Batch Criteria */}
        <Card>
          <View style={styles.sectionTitleRow}>
            <GraduationCap size={18} color="#2563EB" />
            <Text style={[typography.h4, { color: colors.text, marginLeft: 8 }]}>
              Eligibility & Batch Requirements
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Text style={[typography.captionBold, { color: colors.textSecondary }]}>Target Graduation Batches:</Text>
            <Text style={[typography.bodyBold, { color: colors.primary, marginTop: 2 }]}>
              {job.eligible_batches && job.eligible_batches.length > 0
                ? job.eligible_batches.join(', ')
                : 'Open to All Batches (2024, 2025, 2026, 2027)'}
            </Text>
          </View>

          <View style={[styles.criteriaItem, { marginTop: 10 }]}>
            <Text style={[typography.captionBold, { color: colors.textSecondary }]}>Eligible Qualifications:</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              {job.eligible_qualifications && job.eligible_qualifications.length > 0
                ? job.eligible_qualifications.join(', ')
                : 'B.Tech / B.E / BCA / MCA / M.Tech in CS, IT, ECE or related engineering disciplines'}
            </Text>
          </View>

          <View style={[styles.criteriaItem, { marginTop: 10 }]}>
            <Text style={[typography.captionBold, { color: colors.textSecondary }]}>Candidate Profile:</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              {job.candidate_type || 'Freshers, College Graduates & Early Career Engineers'}
            </Text>
          </View>
        </Card>

        {/* Application Portal Info Card */}
        {job.apply_url ? (
          <Card style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
            <View style={styles.sectionTitleRow}>
              <ExternalLink size={18} color="#2563EB" />
              <Text style={[typography.h4, { color: '#1E3A8A', marginLeft: 8 }]}>
                Verified Application Portal
              </Text>
            </View>
            <Text style={[typography.caption, { color: '#3B82F6', marginTop: 4 }]}>
              This opening directs to the official company hiring page:
            </Text>
            <Text style={[typography.tiny, { color: '#1D4ED8', marginTop: 4, fontFamily: 'monospace' }]} numberOfLines={1}>
              {job.apply_url}
            </Text>
          </Card>
        ) : null}

        {/* Job Description */}
        <Card>
          <Text style={[typography.h4, { color: colors.text, marginBottom: 10 }]}>
            Opportunity Description
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {job.description || 'Join the engineering team to build scalable, fault-tolerant platforms and user-centric features.'}
          </Text>
        </Card>

        {/* Skills Required */}
        {job.skills_required && job.skills_required.length > 0 && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 12 }]}>
              Required Competencies ({job.skills_required.length})
            </Text>
            <View style={styles.skillsWrap}>
              {job.skills_required.map((s) => (
                <Badge key={s} label={s} variant="primary" />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Sticky Application Action Bar */}
      <View style={[styles.applyBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: applied ? '#059669' : '#2563EB' }]}
          onPress={handleApply}
          activeOpacity={0.8}
        >
          {job.apply_url ? (
            <ExternalLink size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.applyBtnText}>
            {applied
              ? '✓ Applied (Re-open Link)'
              : job.apply_url
              ? 'Apply on Official Portal'
              : 'Submit Application'}
          </Text>
        </TouchableOpacity>
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
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  adminBarText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  adminDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  adminDeleteBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
