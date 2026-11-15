import apiClient from './client';
import { PreparationRole, PreparationMaterial } from '../types';
import { APP_CONFIG } from '../constants/config';

export const placementPrepApi = {
  getRoles: async (): Promise<PreparationRole[]> => {
    const res = await apiClient.get('/placement-preparation/roles');
    return res.data;
  },

  getRoleBySlug: async (slug: string): Promise<PreparationRole> => {
    const res = await apiClient.get(`/placement-preparation/roles/${encodeURIComponent(slug)}`);
    return res.data;
  },

  getRoleMaterials: async (
    slug: string,
    params: { topic_id?: string; search?: string } = {}
  ): Promise<PreparationMaterial[]> => {
    const res = await apiClient.get(`/placement-preparation/roles/${encodeURIComponent(slug)}/materials`, {
      params,
    });
    return res.data;
  },

  getPreviewUrl: (materialId: string): string => {
    return `${APP_CONFIG.API_BASE_URL}/placement-preparation/materials/${materialId}/preview`;
  },

  getDownloadUrl: (materialId: string): string => {
    return `${APP_CONFIG.API_BASE_URL}/placement-preparation/materials/${materialId}/download`;
  },
};
