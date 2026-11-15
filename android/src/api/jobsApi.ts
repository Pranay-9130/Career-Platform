import apiClient from './client';
import { Job, JobApplication } from '../types';

export const jobsApi = {
  getJobs: async (params: {
    domain?: string;
    job_type?: string;
    work_mode?: string;
    search?: string;
  } = {}): Promise<Job[]> => {
    const res = await apiClient.get('/jobs', { params });
    return res.data;
  },

  getJobById: async (id: string): Promise<Job> => {
    const res = await apiClient.get(`/jobs/${id}`);
    return res.data;
  },

  bookmarkJob: async (jobId: string): Promise<{ is_bookmarked: boolean }> => {
    const res = await apiClient.post(`/jobs/${jobId}/bookmark`);
    return res.data;
  },

  applyToJob: async (jobId: string, payload: {
    cover_letter?: string;
    resume_id?: string;
  } = {}): Promise<JobApplication> => {
    const res = await apiClient.post(`/jobs/${jobId}/apply`, payload);
    return res.data;
  },

  getMyApplications: async (): Promise<JobApplication[]> => {
    const res = await apiClient.get('/applications');
    return res.data;
  },
};

