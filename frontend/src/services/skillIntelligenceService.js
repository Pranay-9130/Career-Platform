import api from './api.js';

export const skillIntelligenceService = {
  // 1. Roles catalogue & Target role preference
  getTargetRoles: async () => {
    const res = await api.get('/skill-intelligence/roles');
    return res.data;
  },

  getTargetRole: async () => {
    const res = await api.get('/skill-intelligence/target-role');
    return res.data;
  },

  setTargetRole: async (payload) => {
    const res = await api.put('/skill-intelligence/target-role', payload);
    return res.data;
  },

  // 2. Confirmed Student Skills
  getSkills: async (params = {}) => {
    const res = await api.get('/skill-intelligence/skills', { params });
    return res.data;
  },

  addSkills: async (skills) => {
    const res = await api.post('/skill-intelligence/skills', { skills });
    return res.data;
  },

  updateSkill: async (skillId, payload) => {
    const res = await api.put(`/skill-intelligence/skills/${skillId}`, payload);
    return res.data;
  },

  deleteSkill: async (skillId) => {
    await api.delete(`/skill-intelligence/skills/${skillId}`);
  },

  // 3. Extraction
  extractSkills: async (payload) => {
    const res = await api.post('/skill-intelligence/extract-skills', payload);
    return res.data;
  },

  extractSkillsFromPdf: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/skill-intelligence/extract-skills-from-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  suggestRoles: async (payload = {}) => {
    const res = await api.post('/skill-intelligence/suggest-roles', payload);
    return res.data;
  },

  // 4. Analysis & Recommendations
  getGapAnalysis: async (params = {}) => {
    const res = await api.get('/skill-intelligence/gap-analysis', { params });
    return res.data;
  },

  getRecommendations: async (params = {}) => {
    const res = await api.get('/skill-intelligence/recommendations', { params });
    return res.data;
  },

  // 5. Structured Roadmap
  getRoadmap: async (params = {}) => {
    const res = await api.get('/skill-intelligence/roadmap', { params });
    return res.data;
  },

  // 6. Project Suggestions
  getProjectSuggestions: async (targetRole) => {
    const res = await api.get('/skill-intelligence/project-suggestions', {
      params: targetRole ? { target_role: targetRole } : {},
    });
    return res.data;
  },

  // 7. Dashboard Summary Card
  getDashboardSummary: async () => {
    const res = await api.get('/skill-intelligence/dashboard-summary');
    return res.data;
  },

  // 8. AI Mentor Advice & Multi-Turn Chat
  getAiAdvice: async (customQuestion) => {
    const res = await api.post('/skill-intelligence/ai-advice', {
      custom_question: customQuestion || null,
    });
    return res.data;
  },

  chatWithMentor: async ({ messages, session_id = null }) => {
    const res = await api.post('/skill-intelligence/mentor-chat', {
      messages,
      session_id,
    });
    return res.data;
  },

  // 9. Reassess Career Fit
  reassessCareerFit: async (params = {}) => {
    const res = await api.post('/skill-intelligence/reassess', null, { params });
    return res.data;
  },

  // 10. Learning Resource Progress
  updateResourceProgress: async (payload) => {
    const res = await api.post('/skill-intelligence/resource-progress', payload);
    return res.data;
  },
};

export default skillIntelligenceService;

