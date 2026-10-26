import api from './api';

export const jobService = {
  /**
   * Fetch jobs discovery catalog with filters, search, sorting, and pagination.
   * @param {Object} params - { search, domain, job_type, work_mode, experience_level, featured_only, sort, page, limit, include_facets }
   */
  async getJobs(params = {}) {
    const cleanedParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        cleanedParams[key] = val;
      }
    });

    const response = await api.get('/jobs', { params: cleanedParams });
    return response.data;
  },

  /**
   * Fetch filter facets (domains, job types, work modes, experience levels).
   */
  async getJobFacets() {
    const response = await api.get('/jobs/facets');
    return response.data;
  },

  /**
   * Retrieve single job opportunity by ID.
   * @param {string} id - Job UUID
   */
  async getJobById(id) {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Create a new job opportunity (Admin only).
   * @param {Object} jobData
   */
  async createJob(jobData) {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  /**
   * Update an existing job opportunity (Admin only).
   * @param {string} id
   * @param {Object} jobData
   */
  async updateJob(id, jobData) {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },

  /**
   * Delete or deactivate a job opportunity (Admin only).
   * @param {string} id
   */
  async deleteJob(id) {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Toggle bookmark for a job opportunity.
   * @param {string} id
   */
  async toggleJobBookmark(id) {
    const response = await api.post(`/jobs/${id}/bookmark`);
    return response.data;
  },

  /**
   * Retrieve all saved jobs for current user.
   */
  async getMySavedJobs() {
    const response = await api.get('/jobs/bookmarks/my');
    return response.data;
  },
};

export default jobService;
