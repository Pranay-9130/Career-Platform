import api from './api';

export const applicationService = {
  /**
   * Retrieve list of tracked job applications for current student.
   * @param {Object} params - { status_filter, search }
   */
  async getApplications(params = {}) {
    const cleanedParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        cleanedParams[key] = val;
      }
    });
    const response = await api.get('/applications', { params: cleanedParams });
    return response.data;
  },

  /**
   * Retrieve student application funnel statistics.
   */
  async getApplicationStats() {
    const response = await api.get('/applications/stats');
    return response.data;
  },

  /**
   * Track a new application in pipeline.
   * @param {Object} appData
   */
  async createApplication(appData) {
    const response = await api.post('/applications', appData);
    return response.data;
  },

  /**
   * Retrieve single application by ID.
   * @param {string} id
   */
  async getApplicationById(id) {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  /**
   * Update application status stage, notes, or dates.
   * @param {string} id
   * @param {Object} updateData
   */
  async updateApplication(id, updateData) {
    const response = await api.put(`/applications/${id}`, updateData);
    return response.data;
  },

  /**
   * Remove application from pipeline.
   * @param {string} id
   */
  async deleteApplication(id) {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  },
};

export default applicationService;
