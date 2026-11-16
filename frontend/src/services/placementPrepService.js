import api from './api.js';

export const placementPrepService = {
  // =========================================================================
  // Student Endpoints
  // =========================================================================

  /**
   * Retrieves all active preparation roles with published document counts and topics.
   */
  getRoles: async () => {
    const res = await api.get('/placement-preparation/roles');
    return res.data;
  },

  /**
   * Retrieves specific role details by slug.
   */
  getRoleBySlug: async (slug) => {
    const res = await api.get(`/placement-preparation/roles/${encodeURIComponent(slug)}`);
    return res.data;
  },

  /**
   * Retrieves published PDF materials for a role with optional topic filter and search term.
   */
  getRoleMaterials: async (slug, params = {}) => {
    const res = await api.get(`/placement-preparation/roles/${encodeURIComponent(slug)}/materials`, {
      params,
    });
    return res.data;
  },

  /**
   * Generates direct preview URL.
   */
  getPreviewUrl: (materialId) => {
    return `/api/placement-preparation/materials/${materialId}/preview`;
  },

  /**
   * Fetches preview PDF as a direct verified Blob.
   */
  fetchPreviewBlob: async (materialId) => {
    const response = await api.get(`/placement-preparation/materials/${materialId}/preview`, {
      responseType: 'blob',
    });
    return new Blob([response.data], { type: 'application/pdf' });
  },

  /**
   * Generates direct download URL.
   */
  getDownloadUrl: (materialId) => {
    return `/api/placement-preparation/materials/${materialId}/download`;
  },

  /**
   * Downloads a PDF file programmatically with accurate filename and download counter trigger.
   */
  downloadMaterial: async (materialId, fileName = 'preparation-guide.pdf') => {
    const response = await api.get(`/placement-preparation/materials/${materialId}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // =========================================================================
  // Admin Endpoints
  // =========================================================================

  adminGetRoles: async () => {
    const res = await api.get('/admin/placement-preparation/roles');
    return res.data;
  },

  adminCreateRole: async (payload) => {
    const res = await api.post('/admin/placement-preparation/roles', payload);
    return res.data;
  },

  adminUpdateRole: async (roleId, payload) => {
    const res = await api.put(`/admin/placement-preparation/roles/${roleId}`, payload);
    return res.data;
  },

  adminDeleteRole: async (roleId) => {
    const res = await api.delete(`/admin/placement-preparation/roles/${roleId}`);
    return res.data;
  },

  adminCreateTopic: async (roleId, payload) => {
    const res = await api.post(`/admin/placement-preparation/roles/${roleId}/topics`, payload);
    return res.data;
  },

  adminUpdateTopic: async (topicId, payload) => {
    const res = await api.put(`/admin/placement-preparation/topics/${topicId}`, payload);
    return res.data;
  },

  adminDeleteTopic: async (topicId) => {
    const res = await api.delete(`/admin/placement-preparation/topics/${topicId}`);
    return res.data;
  },

  adminGetMaterials: async (params = {}) => {
    const res = await api.get('/admin/placement-preparation/materials', { params });
    return res.data;
  },

  adminUploadMaterial: async (formData, onProgress = null) => {
    const res = await api.post('/admin/placement-preparation/materials/upload', formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  adminUpdateMaterial: async (materialId, payload) => {
    const res = await api.put(`/admin/placement-preparation/materials/${materialId}`, payload);
    return res.data;
  },

  adminReplaceMaterialPdf: async (materialId, formData, onProgress = null) => {
    const res = await api.post(`/admin/placement-preparation/materials/${materialId}/replace`, formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  adminDeleteMaterial: async (materialId) => {
    const res = await api.delete(`/admin/placement-preparation/materials/${materialId}`);
    return res.data;
  },
};

export default placementPrepService;

