import apiClient from './client';
import { Job } from '../types';

export interface AdminStats {
  pending_submissions: number;
  published_projects: number;
  total_students: number;
  total_jobs: number;
  flagged_reports: number;
}

export interface StudentAdminItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  avatar_url?: string | null;
  headline?: string | null;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get('/admin/stats');
    return res.data;
  },

  getModerationQueue: async (statusFilter = 'Submitted', limit = 50): Promise<any[]> => {
    const params: Record<string, any> = { limit };
    if (statusFilter && statusFilter !== 'All') {
      params.status_filter = statusFilter;
    }
    const res = await apiClient.get('/admin/projects/queue', { params });
    return res.data;
  },

  moderateProject: async (
    projectId: string,
    action: 'approve' | 'reject' | 'request_changes',
    reviewerNotes = ''
  ): Promise<any> => {
    const res = await apiClient.post(`/admin/projects/${projectId}/action`, {
      action,
      reviewer_notes: reviewerNotes,
    });
    return res.data;
  },

  getJobs: async (limit = 100): Promise<Job[]> => {
    const res = await apiClient.get('/admin/jobs', { params: { limit } });
    return res.data;
  },

  createJob: async (jobData: Partial<Job>): Promise<Job> => {
    const res = await apiClient.post('/admin/jobs', jobData);
    return res.data;
  },

  updateJob: async (jobId: string, jobData: Partial<Job>): Promise<Job> => {
    const res = await apiClient.put(`/admin/jobs/${jobId}`, jobData);
    return res.data;
  },

  deleteJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/admin/jobs/${jobId}`);
  },

  getStudents: async (query?: string, limit = 50): Promise<StudentAdminItem[]> => {
    const params: Record<string, any> = { limit };
    if (query) params.query = query;
    const res = await apiClient.get('/admin/students', { params });
    return res.data;
  },
};
