import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../src/api/adminApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import {
  FolderGit2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Github,
  Globe,
  Clock,
  Check,
  X,
} from 'lucide-react-native';

const STATUS_FILTERS = ['Submitted', 'Changes Requested', 'Rejected', 'All'];

export default function AdminProjectsQueueScreen() {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('Submitted');
  const [refreshing, setRefreshing] = useState(false);

  const { data: queue, isLoading, refetch } = useQuery({
    queryKey: ['admin-projects-moderation', activeFilter],
    queryFn: () => adminApi.getModerationQueue(activeFilter, 50),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' | 'request_changes' }) =>
      adminApi.moderateProject(id, action),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert(
        'Submission Updated',
        `Project has been marked as ${vars.action === 'approve' ? 'Published' : vars.action}.`
      );
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Moderation action failed.');
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[typography.h3, { color: colors.text }]}>Project Moderation Queue</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Review and publish student project submissions
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === f ? colors.primary : colors.background,
                  borderColor: activeFilter === f ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: activeFilter === f ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={140} borderRadiusVal={12} />
            <Skeleton height={140} borderRadiusVal={12} />
          </View>
        ) : !queue || queue.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CheckCircle2 size={36} color={colors.success} />
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>
              No Projects in "{activeFilter}"
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              All student submissions in this state have been reviewed.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {queue.map((proj: any) => (
              <Card key={proj.id} style={styles.projCard}>
                <View style={styles.projHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                      {proj.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                      By {proj.owner?.full_name || 'Student'} • {proj.domain || 'Engineering'}
                    </Text>
                  </View>

                  <Badge
                    label={proj.status || 'Submitted'}
                    variant={proj.status === 'Published' ? 'success' : 'warning'}
                  />
                </View>

                {proj.tagline ? (
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={2}>
                    {proj.tagline}
                  </Text>
                ) : null}

                {/* Tags */}
                {proj.tags && proj.tags.length > 0 ? (
                  <View style={styles.tagsWrap}>
                    {proj.tags.slice(0, 4).map((t: string) => (
                      <Badge key={t} label={t} variant="neutral" />
                    ))}
                  </View>
                ) : null}

                {/* External Links */}
                <View style={styles.linksRow}>
                  {proj.github_url ? (
                    <TouchableOpacity
                      style={styles.linkPill}
                      onPress={() => Linking.openURL(proj.github_url)}
                    >
                      <Github size={14} color="#2563EB" />
                      <Text style={styles.linkText}>GitHub Code</Text>
                    </TouchableOpacity>
                  ) : null}

                  {proj.live_url || proj.demo_url ? (
                    <TouchableOpacity
                      style={styles.linkPill}
                      onPress={() => Linking.openURL(proj.live_url || proj.demo_url)}
                    >
                      <Globe size={14} color="#059669" />
                      <Text style={[styles.linkText, { color: '#059669' }]}>Live Demo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsBar}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                    onPress={() =>
                      moderateMutation.mutate({ id: proj.id, action: 'reject' })
                    }
                    disabled={moderateMutation.isPending}
                  >
                    <X size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                    onPress={() =>
                      moderateMutation.mutate({ id: proj.id, action: 'approve' })
                    }
                    disabled={moderateMutation.isPending}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Approve & Publish</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    padding: 28,
    alignItems: 'center',
  },
  projCard: {
    padding: 16,
    marginBottom: 0,
  },
  projHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
