import api from './api';

export const projectService = {
  /**
   * Fetch project discovery catalog with search, multi-faceted filtering, and pagination.
   * @param {Object} params - { search, domain, difficulty, tech, duration, sort, page, limit }
   */
  async getProjects(params = {}) {
    const cleanedParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        cleanedParams[key] = val;
      }
    });

    const response = await api.get('/projects', { params: cleanedParams });
    return response.data;
  },

  /**
   * Fetch discovery facets (domains, difficulties, technologies).
   */
  async getFacets() {
    const response = await api.get('/projects/facets');
    return response.data;
  },

  /**
   * Retrieve project details by slug.
   * @param {string} slug
   */
  async getProjectBySlug(slug) {
    const response = await api.get(`/projects/${slug}`);
    return response.data;
  },

  /**
   * Toggle bookmark for a project (slug or UUID).
   * @param {string} identifier
   */
  async toggleBookmark(identifier) {
    const response = await api.post(`/projects/${identifier}/bookmark`);
    return response.data;
  },

  /**
   * Retrieve related projects for a given project slug.
   * @param {string} slug
   */
  async getRelatedProjects(slug) {
    const response = await api.get(`/projects/${slug}/related`);
    return response.data;
  },

  /**
   * Retrieve all projects saved/bookmarked by the current user.
   */
  async getMyBookmarks() {
    const response = await api.get('/projects/bookmarks/my');
    return response.data;
  },

  /**
   * Submit a new project or save draft.
   * @param {Object} projectData
   */
  async createProject(projectData) {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  /**
   * Update an existing project draft or submission.
   * @param {string} idOrSlug
   * @param {Object} projectData
   */
  async updateProject(idOrSlug, projectData) {
    const response = await api.put(`/projects/${idOrSlug}`, projectData);
    return response.data;
  },

  /**
   * Retrieve all projects created by current student (drafts, submitted, published).
   */
  async getMySubmissions() {
    const response = await api.get('/projects/my/submissions');
    return response.data;
  },

  /**
   * Delete a draft or submission owned by current student.
   * @param {string} idOrSlug
   */
  async deleteProject(idOrSlug) {
    const response = await api.delete(`/projects/${idOrSlug}`);
    return response.data;
  },

  /**
   * Upload and validate a ZIP archive during project drafting.
   * Enforces 50MB limit and binary PK\x03\x04 signature check on server.
   * @param {File} file
   */
  async uploadStandaloneZip(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/projects/upload-zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** Upload a validated project cover image or screenshot (PNG, JPEG, WebP, or GIF). */
  async uploadProjectImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/projects/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Attach a validated ZIP archive to an existing project.
   * @param {string} idOrSlug
   * @param {File} file
   */
  async uploadProjectZip(idOrSlug, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${idOrSlug}/upload-zip`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Get direct download link for project source archive.
   * @param {string} slug
   */
  getDownloadUrl(slug) {
    return `/api/projects/${slug}/download`;
  },
};

export default projectService;

