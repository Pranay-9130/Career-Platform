import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../src/api/adminApi';
import { Job } from '../../src/types';
import { useThemeStore } from '../../src/store/themeStore';
import { typography, borderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Skeleton } from '../../src/components/common/Skeleton';
import {
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MapPin,
  Building,
  DollarSign,
  Search,
  X,
} from 'lucide-react-native';

export default function AdminJobsScreen() {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // New Job Form State
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('Remote');
  const [jobType, setJobType] = useState('Full-time');
  const [workMode, setWorkMode] = useState('Remote');
  const [salary, setSalary] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [eligibleBatches, setEligibleBatches] = useState('2024, 2025, 2026');
  const [candidateType, setCandidateType] = useState('College Students & Freshers');
  const [description, setDescription] = useState('');

  const { data: jobs, isLoading, refetch } = useQuery<Job[]>({
    queryKey: ['admin-jobs-list'],
    queryFn: () => adminApi.getJobs(100),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredJobs = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : (jobs as any)?.items || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (j: Job) =>
        j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  // Create Job Mutation
  const createMutation = useMutation({
    mutationFn: (newJob: Partial<Job>) => adminApi.createJob(newJob),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs-list'] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'New opportunity created successfully on AspirePath.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to create job.');
    },
  });

  // Delete Job Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs-list'] });
      Alert.alert('Deleted', 'Opportunity removed successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to delete job.');
    },
  });

  const resetForm = () => {
    setTitle('');
    setCompanyName('');
    setLocation('Remote');
    setJobType('Full-time');
    setSalary('');
    setApplyUrl('');
    setDescription('');
  };

  const handleCreateSubmit = () => {
    if (!title.trim() || !companyName.trim() || !applyUrl.trim()) {
      Alert.alert('Validation Error', 'Please enter Title, Company Name, and Apply Link.');
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      company_name: companyName.trim(),
      location: location.trim(),
      job_type: jobType,
      work_mode: workMode,
      stipend_or_salary: salary.trim() || 'Best in Industry',
      apply_url: applyUrl.trim(),
      application_method: 'EXTERNAL',
      domain: 'Software Engineering',
      experience_level: 'Entry Level',
      skills_required: ['Problem Solving', 'Data Structures', 'Communication'],
      description: description.trim() || `${title} opening at ${companyName}. Eligible batches: ${eligibleBatches}.`,
      responsibilities: ['Develop clean code', 'Collaborate with cross-functional teams'],
      requirements: ['Strong engineering fundamentals', `Target Batch: ${eligibleBatches}`],
      eligible_batches: eligibleBatches.split(',').map((b) => b.trim()),
      candidate_type: candidateType,
      is_active: true,
      is_featured: false,
    });
  };

  const confirmDelete = (job: Job) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove "${job.title}" at ${job.company_name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(job.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[typography.h3, { color: colors.text }]}>Jobs Management</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {filteredJobs.length} opportunities in database
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search by job title or company..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={110} borderRadiusVal={12} />
            <Skeleton height={110} borderRadiusVal={12} />
            <Skeleton height={110} borderRadiusVal={12} />
          </View>
        ) : filteredJobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Briefcase size={36} color={colors.textMuted} />
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: 8 }]}>No Jobs Found</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              Post a new opportunity using the button above.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredJobs.map((job: Job) => (
              <Card key={job.id} style={styles.jobCard}>
                <View style={styles.jobCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                      {job.company_name} • {job.location || 'Remote'}
                    </Text>
                  </View>

                  <Badge
                    label={job.is_active ? 'Active' : 'Unpublished'}
                    variant={job.is_active ? 'success' : 'neutral'}
                  />
                </View>

                {job.eligible_batches && job.eligible_batches.length > 0 ? (
                  <Text style={[typography.tiny, { color: colors.primary, marginTop: 6 }]}>
                    Eligible: {job.eligible_batches.join(', ')}
                  </Text>
                ) : null}

                <View style={styles.jobActionsRow}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {job.stipend_or_salary || 'Salary Disclosed'}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => confirmDelete(job)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Post Job Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: colors.text }]}>Post New Job Opening</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>JOB TITLE *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Associate Software Engineer"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>COMPANY NAME *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Google / Microsoft / Startup"
                placeholderTextColor={colors.textMuted}
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.inputLabel}>LOCATION / WORK MODE</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Bengaluru, India (Hybrid) / Remote"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.inputLabel}>SALARY / STIPEND</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. ₹8 - 14 LPA / ₹35,000/month"
                placeholderTextColor={colors.textMuted}
                value={salary}
                onChangeText={setSalary}
              />

              <Text style={styles.inputLabel}>OFFICIAL APPLICATION LINK *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="https://company.careers.com/apply/..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                value={applyUrl}
                onChangeText={setApplyUrl}
              />

              <Text style={styles.inputLabel}>ELIGIBLE GRADUATION BATCHES</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. 2024, 2025, 2026"
                placeholderTextColor={colors.textMuted}
                value={eligibleBatches}
                onChangeText={setEligibleBatches}
              />

              <Text style={styles.inputLabel}>JOB DESCRIPTION / OVERVIEW</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Provide a comprehensive job overview and required qualifications..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={[styles.submitJobBtn, { opacity: createMutation.isPending ? 0.7 : 1 }]}
                onPress={handleCreateSubmit}
                disabled={createMutation.isPending}
              >
                <Text style={styles.submitJobBtnText}>
                  {createMutation.isPending ? 'Publishing...' : 'Publish Opportunity to Live Database'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  jobCard: {
    padding: 14,
    marginBottom: 0,
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  jobActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  deleteBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalFormContent: {
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitJobBtn: {
    backgroundColor: '#2563EB',
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitJobBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
