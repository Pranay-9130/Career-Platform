import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../../src/api/jobsApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import { EmptyState } from '../../src/components/common/EmptyState';
import {
  Layers,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  ChevronRight,
} from 'lucide-react-native';

export default function ApplicationsScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();

  const {
    data: applications,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => jobsApi.getMyApplications(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OFFERED':
        return <Badge label="Offer Received" variant="success" icon={<Award size={12} color="#065F46" />} />;
      case 'INTERVIEW_SCHEDULED':
        return <Badge label="Interview Scheduled" variant="primary" icon={<CheckCircle2 size={12} color="#1D4ED8" />} />;
      case 'UNDER_REVIEW':
        return <Badge label="Under Review" variant="warning" icon={<Clock size={12} color="#92400E" />} />;
      case 'REJECTED':
        return <Badge label="Not Selected" variant="error" icon={<AlertCircle size={12} color="#991B1B" />} />;
      case 'SUBMITTED':
      default:
        return <Badge label="Submitted" variant="neutral" icon={<Clock size={12} color="#475569" />} />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text }]}>Application Tracker</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          Monitor your job applications across recruitment cycles
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={110} borderRadiusVal={16} />
            <Skeleton height={110} borderRadiusVal={16} />
            <Skeleton height={110} borderRadiusVal={16} />
          </View>
        ) : !applications || applications.length === 0 ? (
          <EmptyState
            icon={<Layers size={28} color={colors.primary} />}
            title="No Applications Submitted"
            description="Explore verified tech openings and apply with your tailored ATS resume to begin tracking."
            actionTitle="Browse Opportunities"
            onAction={() => router.push('/(tabs)/jobs')}
          />
        ) : (
          applications.map((app) => (
            <TouchableOpacity
              key={app.id}
              activeOpacity={0.8}
              onPress={() => app.job_id && router.push(`/jobs/${app.job_id}` as any)}
            >
              <Card style={styles.appCard}>
                <View style={styles.topRow}>
                  <View style={styles.companyIcon}>
                    <Briefcase size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>
                      {app.job?.title || 'Engineering Role'}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 1 }]}>
                      {app.job?.company_name || 'Hiring Organization'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                  {getStatusBadge(app.status)}
                  <View style={styles.dateRow}>
                    <Calendar size={13} color={colors.textMuted} />
                    <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 4 }]}>
                      Applied {formatDate(app.applied_at)}
                    </Text>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  appCard: {
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

