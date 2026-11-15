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
import { projectsApi } from '../../src/api/projectsApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import { EmptyState } from '../../src/components/common/EmptyState';
import {
  Search,
  FolderGit2,
  Star,
  Bookmark,
  Github,
  ExternalLink,
  ChevronRight,
  Code,
} from 'lucide-react-native';

const DOMAIN_FILTERS = ['All Domains', 'Frontend', 'Backend', 'Full Stack', 'Mobile', 'AI / ML', 'Cloud'];

export default function ProjectsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');

  const {
    data: projects,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects(),
  });

  const starMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.starProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.bookmarkProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
    },
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((proj) => {
      if (selectedDomain !== 'All Domains' && proj.domain !== selectedDomain) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = proj.title.toLowerCase().includes(q);
        const matchDesc = proj.description.toLowerCase().includes(q);
        const matchTags = proj.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }
      return true;
    });
  }, [projects, selectedDomain, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: 12 }]}>
          Peer Project Showcase
        </Text>

        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search projects, architectures, or frameworks..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, typography.body, { color: colors.text }]}
          />
        </View>

        {/* Domain Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {DOMAIN_FILTERS.map((d) => (
            <TouchableOpacity
              key={d}
              activeOpacity={0.7}
              onPress={() => setSelectedDomain(d)}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedDomain === d ? colors.primary : colors.background,
                  borderColor: selectedDomain === d ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedDomain === d ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {d}
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
            <Skeleton height={150} borderRadiusVal={16} />
            <Skeleton height={150} borderRadiusVal={16} />
          </View>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 size={28} color={colors.primary} />}
            title="No Projects Found"
            description="Try modifying your domain filter or search term to discover student architecture showcases."
            actionTitle="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedDomain('All Domains');
            }}
          />
        ) : (
          filteredProjects.map((proj) => (
            <TouchableOpacity
              key={proj.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/projects/${proj.id}` as any)}
            >
              <Card style={styles.projectCard}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Badge label={proj.domain} variant="primary" style={{ marginBottom: 6 }} />
                    <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>
                      {proj.title}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => starMutation.mutate(proj.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.starBtn}
                    >
                      <Star
                        size={18}
                        color={proj.is_starred ? '#F59E0B' : colors.textMuted}
                        fill={proj.is_starred ? '#F59E0B' : 'transparent'}
                      />
                      <Text style={[typography.tiny, { color: colors.textSecondary, marginLeft: 4 }]}>
                        {proj.stars_count}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => bookmarkMutation.mutate(proj.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Bookmark
                        size={18}
                        color={proj.is_bookmarked ? colors.primary : colors.textMuted}
                        fill={proj.is_bookmarked ? colors.primary : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8, lineHeight: 20 }]} numberOfLines={2}>
                  {proj.tagline || proj.description}
                </Text>

                {/* Tags */}
                {proj.tags && proj.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {proj.tags.slice(0, 4).map((tag) => (
                      <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.background }]}>
                        <Code size={11} color={colors.textMuted} />
                        <Text style={[typography.tiny, { color: colors.textMuted, marginLeft: 4 }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    By {proj.author_name || 'AspirePath Author'}
                  </Text>
                  <View style={styles.viewRow}>
                    <Text style={[typography.captionBold, { color: colors.primary, marginRight: 4 }]}>
                      Inspect Code
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  projectCard: {
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
