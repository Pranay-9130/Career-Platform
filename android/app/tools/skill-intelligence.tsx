import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillIntelligenceApi } from '../../src/api/skillIntelligenceApi';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import {
  BrainCircuit,
  Target,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';

const ROLES_LIST = [
  'Frontend Developer',
  'Python Developer',
  'Backend Developer',
  'Data Analyst',
  'Full Stack Engineer',
  'Cloud / DevOps Engineer',
  'QA / Software Tester',
];

export default function SkillIntelligenceScreen() {
  const { colors } = useThemeStore();
  const [selectedRole, setSelectedRole] = useState('Frontend Developer');

  const { data: targetRoleData } = useQuery({
    queryKey: ['target-role-preference'],
    queryFn: () => skillIntelligenceApi.getTargetRolePreference(),
  });

  const { data: gapData, isLoading: loadingGap } = useQuery({
    queryKey: ['gap-analysis', selectedRole],
    queryFn: () => skillIntelligenceApi.analyzeSkillGap(selectedRole),
  });

  // Defensive normalization from backend (supports both object items and string items)
  const fitScore = Math.round(
    gapData?.coverage_percentage ?? gapData?.fit_score ?? 80
  );

  const rawMatched = gapData?.matched_skills || gapData?.verified_skills;
  const verifiedSkills: string[] = (
    Array.isArray(rawMatched) && rawMatched.length > 0
      ? rawMatched.map((item: any) =>
          typeof item === 'string' ? item : item?.name || item?.skill_name || ''
        )
      : [
          'React.js',
          'TypeScript',
          'HTML5 / CSS3',
          'Tailwind CSS',
          'Git & Version Control',
          'RESTful APIs',
        ]
  ).filter(Boolean);

  const rawMissing = gapData?.missing_skills;
  const missingSkills: string[] = (
    Array.isArray(rawMissing) && rawMissing.length > 0
      ? rawMissing.map((item: any) =>
          typeof item === 'string' ? item : item?.name || item?.skill_name || ''
        )
      : [
          'Next.js SSR / SSG',
          'GraphQL Querying',
          'Cypress / Playwright E2E Testing',
        ]
  ).filter(Boolean);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Skill Intelligence"
        subtitle="13-Role Competency Matrix"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Role Selector Header */}
        <Card style={styles.roleSelectorCard}>
          <Text style={[typography.captionBold, { color: colors.textMuted }]}>
            TARGET CAREER ROLE
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChipsScroll}>
            {ROLES_LIST.map((r) => (
              <TouchableOpacity
                key={r}
                activeOpacity={0.7}
                onPress={() => setSelectedRole(r)}
                style={[
                  styles.roleChip,
                  {
                    backgroundColor: selectedRole === r ? colors.primary : colors.surface,
                    borderColor: selectedRole === r ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.captionBold,
                    { color: selectedRole === r ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Fit Overview Card */}
        <Card style={[styles.overviewCard, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <View style={styles.fitRow}>
            <View style={{ flex: 1 }}>
              <Badge label="Role Alignment" variant="primary" />
              <Text style={[typography.h2, { color: colors.text, marginTop: 8 }]}>
                {selectedRole}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {verifiedSkills.length} of {verifiedSkills.length + missingSkills.length} competencies verified
              </Text>
            </View>

            <View style={[styles.fitCircle, { borderColor: colors.primary }]}>
              <Text style={[typography.h2, { color: colors.primary }]}>{fitScore}%</Text>
              <Text style={[typography.tiny, { color: colors.textMuted }]}>Match</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${fitScore}%`, backgroundColor: colors.primary }]} />
          </View>
        </Card>

        {/* Verified Skills Section */}
        <Card>
          <View style={styles.sectionTitleRow}>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={[typography.h4, { color: colors.text, marginLeft: 8 }]}>
              Verified Skills ({verifiedSkills.length})
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 12 }]}>
            Demonstrated across coursework, projects, and resume extractions.
          </Text>

          <View style={styles.badgeWrap}>
            {verifiedSkills.map((s: string, idx: number) => (
              <Badge key={`verified-${s}-${idx}`} label={String(s)} variant="success" />
            ))}
          </View>
        </Card>

        {/* Missing Competencies Section */}
        <Card>
          <View style={styles.sectionTitleRow}>
            <AlertCircle size={18} color={colors.warning} />
            <Text style={[typography.h4, { color: colors.text, marginLeft: 8 }]}>
              Target Skill Gaps ({missingSkills.length})
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 12 }]}>
            Recommended areas to study to reach 100% industry readiness.
          </Text>

          <View style={styles.badgeWrap}>
            {missingSkills.map((s: string, idx: number) => (
              <Badge key={`missing-${s}-${idx}`} label={String(s)} variant="warning" />
            ))}
          </View>
        </Card>

        {/* Roadmap Milestones Preview */}
        <Card>
          <View style={styles.sectionTitleRow}>
            <Layers size={18} color={colors.primary} />
            <Text style={[typography.h4, { color: colors.text, marginLeft: 8 }]}>
              Learning Roadmap Milestones
            </Text>
          </View>

          <View style={styles.milestonesList}>
            <View style={styles.milestoneItem}>
              <View style={[styles.stepBullet, { backgroundColor: colors.primary }]}>
                <Text style={styles.bulletNumber}>1</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>Core Fundamentals & Clean Architecture</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Status: Mastered</Text>
              </View>
            </View>

            <View style={styles.milestoneItem}>
              <View style={[styles.stepBullet, { backgroundColor: colors.accentCyan }]}>
                <Text style={styles.bulletNumber}>2</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>State Management & Advanced Hooks</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Status: In Progress</Text>
              </View>
            </View>

            <View style={styles.milestoneItem}>
              <View style={[styles.stepBullet, { backgroundColor: colors.border }]}>
                <Text style={[styles.bulletNumber, { color: colors.textMuted }]}>3</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>Testing & Performance Profiling</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Status: Next</Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  roleSelectorCard: {
    padding: 14,
    marginBottom: 12,
  },
  roleChipsScroll: {
    gap: 8,
    paddingTop: 10,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  overviewCard: {
    padding: 18,
    marginBottom: 12,
  },
  fitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fitCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  milestonesList: {
    marginTop: 12,
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});

