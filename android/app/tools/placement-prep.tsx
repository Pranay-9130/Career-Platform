import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { placementPrepApi } from '../../src/api/placementPrepApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import { EmptyState } from '../../src/components/common/EmptyState';
import {
  BookOpen,
  FileText,
  Download,
  Eye,
  Calendar,
  HardDrive,
  X,
  CheckCircle2,
  Share2,
} from 'lucide-react-native';
import { PreparationMaterial } from '../../src/types';

export default function PlacementPrepScreen() {
  const { colors } = useThemeStore();

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ['prep-roles'],
    queryFn: () => placementPrepApi.getRoles(),
  });

  const [selectedRoleSlug, setSelectedRoleSlug] = useState<string>('python-developer');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('ALL');
  const [previewMaterial, setPreviewMaterial] = useState<PreparationMaterial | null>(null);

  // Set default active role slug when roles load
  React.useEffect(() => {
    if (roles && roles.length > 0 && !selectedRoleSlug) {
      setSelectedRoleSlug(roles[0].slug);
    }
  }, [roles, selectedRoleSlug]);

  const activeRole = useMemo(() => {
    return roles?.find((r) => r.slug === selectedRoleSlug);
  }, [roles, selectedRoleSlug]);

  const { data: materials, isLoading: loadingMaterials } = useQuery({
    queryKey: ['prep-materials', selectedRoleSlug],
    queryFn: () => placementPrepApi.getRoleMaterials(selectedRoleSlug),
    enabled: !!selectedRoleSlug,
  });

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    if (selectedTopicId === 'ALL') return materials;
    return materials.filter((m) => m.topic_id === selectedTopicId);
  }, [materials, selectedTopicId]);

  const handleDownload = (material: PreparationMaterial) => {
    Alert.alert(
      'Download Preparation Guide',
      `Downloading "${material.title}" (${material.file_size_formatted || 'PDF'}). Saved to your offline storage.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Placement Preparation"
        subtitle="Technical question banks & PDF guides"
      />

      {/* Role Selection Horizontal Tabs */}
      <View style={[styles.roleTabsWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleTabsScroll}>
          {(roles || []).map((r) => (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedRoleSlug(r.slug);
                setSelectedTopicId('ALL');
              }}
              style={[
                styles.roleTab,
                {
                  backgroundColor: selectedRoleSlug === r.slug ? colors.primary : colors.background,
                  borderColor: selectedRoleSlug === r.slug ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedRoleSlug === r.slug ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {r.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Topics Filter Chips */}
      {activeRole?.topics && activeRole.topics.length > 0 && (
        <View style={[styles.topicChipsWrap, { borderBottomColor: colors.borderLight }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicChipsScroll}>
            <TouchableOpacity
              onPress={() => setSelectedTopicId('ALL')}
              style={[
                styles.topicChip,
                {
                  backgroundColor: selectedTopicId === 'ALL' ? colors.primaryLight : colors.background,
                  borderColor: selectedTopicId === 'ALL' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.tiny,
                  { color: selectedTopicId === 'ALL' ? colors.primary : colors.textMuted },
                ]}
              >
                All Topics ({materials?.length || 0})
              </Text>
            </TouchableOpacity>

            {activeRole.topics.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedTopicId(t.id)}
                style={[
                  styles.topicChip,
                  {
                    backgroundColor: selectedTopicId === t.id ? colors.primaryLight : colors.background,
                    borderColor: selectedTopicId === t.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.tiny,
                    { color: selectedTopicId === t.id ? colors.primary : colors.textMuted },
                  ]}
                >
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Materials List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loadingMaterials ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={130} borderRadiusVal={16} />
            <Skeleton height={130} borderRadiusVal={16} />
          </View>
        ) : filteredMaterials.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={28} color={colors.primary} />}
            title="No Documents in this Topic"
            description="Administrators are adding technical question banks regularly. Check back soon or switch topics."
            actionTitle="Show All Track Guides"
            onAction={() => setSelectedTopicId('ALL')}
          />
        ) : (
          filteredMaterials.map((mat) => (
            <Card key={mat.id} style={styles.matCard}>
              <View style={styles.matTopRow}>
                <View style={styles.pdfBadge}>
                  <Text style={styles.pdfBadgeText}>PDF</Text>
                </View>
                {mat.topic_name && <Badge label={mat.topic_name} variant="primary" />}
              </View>

              <Text style={[typography.h4, { color: colors.text, marginTop: 8 }]} numberOfLines={2}>
                {mat.title}
              </Text>

              {mat.description && (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, lineHeight: 18 }]} numberOfLines={2}>
                  {mat.description}
                </Text>
              )}

              {/* Meta row */}
              <View style={styles.matMetaRow}>
                <View style={styles.metaItem}>
                  <HardDrive size={13} color={colors.textMuted} />
                  <Text style={[typography.tiny, { color: colors.textMuted, marginLeft: 4 }]}>
                    {mat.file_size_formatted || 'PDF'} • {mat.page_count} {mat.page_count === 1 ? 'page' : 'pages'}
                  </Text>
                </View>

                {mat.download_count > 0 && (
                  <View style={styles.metaItem}>
                    <Download size={13} color={colors.success} />
                    <Text style={[typography.tiny, { color: colors.success, marginLeft: 4 }]}>
                      {mat.download_count} downloads
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={[styles.matActionsRow, { borderTopColor: colors.borderLight }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPreviewMaterial(mat)}
                  style={[styles.actionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Eye size={15} color={colors.textSecondary} />
                  <Text style={[typography.captionBold, { color: colors.textSecondary, marginLeft: 6 }]}>
                    Preview PDF
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleDownload(mat)}
                  style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Download size={15} color="#FFFFFF" />
                  <Text style={[typography.captionBold, { color: '#FFFFFF', marginLeft: 6 }]}>
                    Download
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* In-App PDF Preview Modal */}
      {previewMaterial && (
        <Modal
          visible={!!previewMaterial}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setPreviewMaterial(null)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>
                  {previewMaterial.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {previewMaterial.topic_name || 'Technical Question Bank'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewMaterial(null)}
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.mockPdfViewer, { backgroundColor: colors.surface }]}>
              <View style={styles.pdfDocHeader}>
                <Text style={[typography.h3, { color: colors.primary, textAlign: 'center' }]}>
                  {previewMaterial.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 4 }]}>
                  AspirePath Technical Placement Preparation Guide
                </Text>
              </View>

              <View style={[styles.pdfSampleContent, { backgroundColor: colors.background }]}>
                <Text style={[typography.captionBold, { color: colors.text, marginBottom: 6 }]}>
                  1. High-Frequency Interview Questions & Solutions
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
                  Comprehensive technical breakdowns, algorithmic complexity, memory management, and practical coding patterns verified for campus placements.
                </Text>
              </View>
            </View>

            <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <Button
                title={`Download ${previewMaterial.file_size_formatted || 'PDF'}`}
                onPress={() => {
                  handleDownload(previewMaterial);
                  setPreviewMaterial(null);
                }}
                icon={<Download size={16} color="#FFFFFF" />}
                style={{ width: '100%' }}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  roleTabsWrap: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  roleTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  roleTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  topicChipsWrap: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  topicChipsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  matCard: {
    padding: 16,
    marginBottom: 12,
  },
  matTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pdfBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pdfBadgeText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 10,
  },
  matMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockPdfViewer: {
    flex: 1,
    margin: 16,
    borderRadius: borderRadius.lg,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pdfDocHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pdfSampleContent: {
    padding: 16,
    borderRadius: borderRadius.md,
    marginTop: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
});

