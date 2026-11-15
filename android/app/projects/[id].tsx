import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../src/api/projectsApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import {
  FolderGit2,
  Star,
  Bookmark,
  Github,
  ExternalLink,
  Code,
  User,
  Share2,
} from 'lucide-react-native';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { colors } = useThemeStore();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: () => projectsApi.getProjectById(id!),
    enabled: !!id,
  });

  const starMutation = useMutation({
    mutationFn: () => projectsApi.starProject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', id] });
    },
  });

  if (isLoading || !project) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Project Details" />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={180} borderRadiusVal={16} />
          <Skeleton height={120} borderRadiusVal={16} />
        </View>
      </SafeAreaView>
    );
  }

  const openUrl = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Invalid URL', 'Unable to open link.'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={project.title}
        subtitle={`By ${project.author_name || 'AspirePath Contributor'}`}
        rightAction={
          <TouchableOpacity onPress={() => starMutation.mutate()} style={styles.starHeaderBtn}>
            <Star
              size={20}
              color={project.is_starred ? '#F59E0B' : colors.text}
              fill={project.is_starred ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Project Hero Card */}
        <Card>
          <Badge label={project.domain} variant="primary" style={{ marginBottom: 8 }} />
          <Text style={[typography.h2, { color: colors.text }]}>{project.title}</Text>

          {project.tagline && (
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' }]}>
              "{project.tagline}"
            </Text>
          )}

          <View style={[styles.authorRow, { borderTopColor: colors.borderLight }]}>
            <View style={styles.authorAvatar}>
              <User size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.captionBold, { color: colors.text }]}>
                {project.author_name || 'Engineering Student'}
              </Text>
              <Text style={[typography.tiny, { color: colors.textMuted }]}>Author & Maintainer</Text>
            </View>
            <Badge label={`${project.stars_count} Stars`} variant="warning" />
          </View>
        </Card>

        {/* Tech Stack */}
        {project.tags && project.tags.length > 0 && (
          <Card>
            <Text style={[typography.h4, { color: colors.text, marginBottom: 10 }]}>
              Technology Stack
            </Text>
            <View style={styles.tagsWrap}>
              {project.tags.map((tag) => (
                <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.background }]}>
                  <Code size={13} color={colors.primary} />
                  <Text style={[typography.captionBold, { color: colors.textSecondary, marginLeft: 6 }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Description / Architecture */}
        <Card>
          <Text style={[typography.h4, { color: colors.text, marginBottom: 10 }]}>
            System Overview & Architecture
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {project.description}
          </Text>
        </Card>

        {/* Project Links CTA */}
        <View style={styles.linksRow}>
          {project.github_url && (
            <Button
              title="GitHub Repository"
              onPress={() => openUrl(project.github_url)}
              variant="outline"
              icon={<Github size={16} color={colors.primary} />}
              style={{ flex: 1 }}
            />
          )}

          {project.live_url && (
            <Button
              title="Live Showcase"
              onPress={() => openUrl(project.live_url)}
              icon={<ExternalLink size={16} color="#FFFFFF" />}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starHeaderBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
