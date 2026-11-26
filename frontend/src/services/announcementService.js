import api from './api.js';

export const announcementService = {
  // Student / User Endpoints
  getActiveAnnouncements: async () => {
    const res = await api.get('/announcements/active');
    return res.data;
  },

  trackAnnouncement: async (announcementId, status) => {
    // status: 'SEEN' | 'DISMISSED' | 'DEFERRED'
    const res = await api.post(`/announcements/${announcementId}/track`, { status });
    return res.data;
  },

  // Admin Endpoints
  getAdminAnnouncements: async () => {
    const res = await api.get('/admin/announcements');
    return res.data;
  },

  listAllForAdmin: async () => {
    const res = await api.get('/admin/announcements');
    return res.data;
  },

  createAnnouncement: async (payload) => {
    const res = await api.post('/admin/announcements', payload);
    return res.data;
  },

  updateAnnouncement: async (announcementId, payload) => {
    const res = await api.put(`/admin/announcements/${announcementId}`, payload);
    return res.data;
  },

  deleteAnnouncement: async (announcementId) => {
    const res = await api.delete(`/admin/announcements/${announcementId}`);
    return res.data;
  },
};
