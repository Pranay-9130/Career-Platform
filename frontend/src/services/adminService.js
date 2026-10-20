import api from './api';

export const adminService = {
  /**
   * Retrieve platform-wide operational statistics for the admin dashboard.
   */
  async getAdminStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Retrieve project submissions in the moderation queue.
   * @param {string} statusFilter - 'Submitted' | 'Changes Requested' | 'Rejected' | 'All'
   */
  async getModerationQueue(statusFilter = 'Submitted') {
    const params = {};
    if (statusFilter && statusFilter !== 'All') {
      params.status_filter = statusFilter;
    }
    const response = await api.get('/admin/projects/queue', { params });
    return response.data;
  },

  /**
   * Moderate a project submission (approve, reject, request_changes).
   * @param {string} identifier - Project UUID or slug
   * @param {Object} payload - { action: 'approve' | 'reject' | 'request_changes', reviewer_notes?: string }
   */
  async moderateProject(identifier, payload) {
    const response = await api.post(`/admin/projects/${identifier}/moderate`, payload);
    return response.data;
  },

  /**
   * Permanently delete a project submission.
   */
  async deleteProject(identifier) {
    const response = await api.delete(`/admin/projects/${identifier}`);
    return response.data;
  },

  /**
   * Permanently delete all project submissions.
   */
  async clearAllProjects() {
    const response = await api.post('/admin/projects/clear-all');
    return response.data;
  },

  /**
   * Retrieve all jobs including drafts and unpublished listings for admin management.
   */
  async getJobs(params = {}) {
    const response = await api.get('/admin/jobs', { params });
    return response.data;
  },

  /**
   * Create a new job or internship opportunity with all requirements.
   */
  async createJob(jobData) {
    const response = await api.post('/admin/jobs', jobData);
    return response.data;
  },

  /**
   * Update an existing job posting.
   */
  async updateJob(jobId, jobData) {
    const response = await api.put(`/admin/jobs/${jobId}`, jobData);
    return response.data;
  },

  /**
   * Toggle job publication status between active and inactive.
   */
  async toggleJobStatus(jobId) {
    const response = await api.patch(`/admin/jobs/${jobId}/toggle-status`);
    return response.data;
  },

  /**
   * Delete a job posting.
   */
  async deleteJob(jobId) {
    const response = await api.delete(`/admin/jobs/${jobId}`);
    return response.data;
  },

  /**
   * List all registered students with academic info and project counts.
   */
  async getStudents(params = {}) {
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  /**
   * List all active resume templates.
   */
  async getTemplates() {
    const response = await api.get('/admin/templates');
    return response.data;
  },

  /**
   * Add a new resume template to the catalog.
   */
  async createTemplate(templateData) {
    const response = await api.post('/admin/templates', templateData);
    return response.data;
  },

  /**
   * Upload a resume template file (PDF, Word DOCX, ZIP, LaTeX, etc.).
   */
  async uploadTemplateFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/templates/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * 1-Click direct template upload & publication:
   * Uploads file, automatically creates, and publishes template to candidate portal.
   */
  async directUploadTemplate(file, extraData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (extraData.title) formData.append('title', extraData.title);
    if (extraData.badge) formData.append('badge', extraData.badge);
    if (extraData.description) formData.append('description', extraData.description);

    const response = await api.post('/admin/templates/direct-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete or remove a custom template from the catalog.
   */
  async deleteTemplate(templateId) {
    const response = await api.delete(`/admin/templates/${templateId}`);
    return response.data;
  },

  /**
   * Update an existing template's information.
   */
  async updateTemplate(templateId, templateData) {
    const response = await api.put(`/admin/templates/${templateId}`, templateData);
    return response.data;
  },

  /**
   * Toggle template publication status (active / draft).
   */
  async toggleTemplateStatus(templateId) {
    const response = await api.patch(`/admin/templates/${templateId}/toggle-status`);
    return response.data;
  },

  /**
   * Seed/restore default templates matching screenshot (Template 1, Template 2, Template 3).
   */
  async seedDefaultTemplates() {
    const response = await api.post('/admin/templates/seed-defaults');
    return response.data;
  },

  /**
   * Clear all templates so admin can start completely fresh.
   */
  async clearAllTemplates() {
    const response = await api.post('/admin/templates/clear-all');
    return response.data;
  },
};

export default adminService;
