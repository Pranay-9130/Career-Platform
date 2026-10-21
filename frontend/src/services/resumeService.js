import api from './api';

export const DEFAULT_EXCLUDED_TEMPLATE_IDS = new Set([
  'classic-tech',
  'modern-minimal',
  'research-academic',
  'compact-dense',
  'template-1',
  'template-2',
  'template-3',
]);

export const resumeService = {
  /**
   * Fetch catalogue of available ATS templates (exclusively user-uploaded/added).
   */
  async getTemplates() {
    const response = await api.get('/resumes/templates');
    const list = Array.isArray(response.data) ? response.data : [];
    return list.filter((t) => !DEFAULT_EXCLUDED_TEMPLATE_IDS.has(t.id));
  },

  /**
   * Fetch all resumes for the authenticated user.
   */
  async getResumes() {
    const response = await api.get('/resumes');
    return response.data;
  },

  /**
   * Fetch a single resume by UUID.
   * @param {string} id
   */
  async getResume(id) {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },

  /**
   * Create a new resume.
   * @param {object} payload
   */
  async createResume(payload) {
    const response = await api.post('/resumes', payload);
    return response.data;
  },

  /**
   * Seed a new resume automatically using student's profile & project submissions.
   * @param {string} templateId
   */
  async seedFromProfile(templateId = 'classic-tech') {
    const response = await api.post('/resumes/seed-from-profile', null, {
      params: { template_id: templateId },
    });
    return response.data;
  },

  /**
   * Update an existing resume.
   * @param {string} id
   * @param {object} payload
   */
  async updateResume(id, payload) {
    const response = await api.put(`/resumes/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a resume.
   * @param {string} id
   */
  async deleteResume(id) {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },

  /**
   * Duplicate a resume into a draft copy.
   * @param {string} id
   */
  async duplicateResume(id) {
    const response = await api.post(`/resumes/${id}/duplicate`);
    return response.data;
  },

  /**
   * Export resume as high-fidelity ATS-compliant PDF file.
   * Automatically triggers browser file download.
   * @param {string} id
   * @param {string} defaultName
   */
  async exportPdf(id, defaultName = 'Resume.pdf') {
    const response = await api.get(`/resumes/${id}/export-pdf`, {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header if available
    let filename = defaultName;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Generate vector ATS PDF preview blob on the fly.
   * @param {object} payload
   */
  async previewPdf(payload) {
    const response = await api.post('/resumes/preview-pdf', payload, {
      responseType: 'blob',
    });
    return new Blob([response.data], { type: 'application/pdf' });
  },

  /**
   * Run dual-input ATS analysis comparing candidate resume against target job description.
   * @param {object} payload { resume_id, resume_text, job_id, job_description }
   */
  async analyzeAts(payload) {
    const response = await api.post('/resumes/analyze-ats', payload);
    return response.data;
  },
};

export default resumeService;
