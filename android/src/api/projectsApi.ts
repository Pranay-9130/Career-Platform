import apiClient from './client';
import { Project } from '../types';

export const projectsApi = {
  getProjects: async (params: {
    domain?: string;
    tag?: string;
    search?: string;
  } = {}): Promise<Project[]> => {
    const res = await apiClient.get('/projects', { params });
    // Backend returns ProjectListResponse: { items: Project[], total: number, ... }
    if (res.data && Array.isArray(res.data.items)) {
      return res.data.items;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  getProjectById: async (id: string): Promise<Project> => {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data;
  },

  starProject: async (projectId: string): Promise<{ stars_count: number; is_starred: boolean }> => {
    const res = await apiClient.post(`/projects/${projectId}/star`);
    return res.data;
  },

  bookmarkProject: async (projectId: string): Promise<{ is_bookmarked: boolean }> => {
    const res = await apiClient.post(`/projects/${projectId}/bookmark`);
    return res.data;
  },

  getMyProjects: async (): Promise<Project[]> => {
    const res = await apiClient.get('/projects/my/submissions');
    if (res.data && Array.isArray(res.data.items)) {
      return res.data.items;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },
};

