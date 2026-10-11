import api from './api';

export const notificationService = {
  /**
   * Retrieve in-app notifications for current student.
   * @param {boolean} unreadOnly
   */
  async getNotifications(unreadOnly = false) {
    const params = unreadOnly ? { unread_only: true } : {};
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get unread notification count for badge.
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a single notification as read.
   * @param {string} id
   */
  async markAsRead(id) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete or dismiss a notification.
   * @param {string} id
   */
  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default notificationService;
