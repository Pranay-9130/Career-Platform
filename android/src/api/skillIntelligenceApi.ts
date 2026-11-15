import apiClient from './client';

export const skillIntelligenceApi = {
  getTargetRoles: async (): Promise<any[]> => {
    const res = await apiClient.get('/skill-intelligence/roles');
    return res.data;
  },

  getTargetRolePreference: async (): Promise<any> => {
    const res = await apiClient.get('/skill-intelligence/target-role');
    return res.data;
  },

  setTargetRolePreference: async (payload: { role_title: string; custom_role?: string }): Promise<any> => {
    const res = await apiClient.put('/skill-intelligence/target-role', payload);
    return res.data;
  },

  getConfirmedSkills: async (): Promise<any[]> => {
    const res = await apiClient.get('/skill-intelligence/skills');
    return res.data;
  },

  analyzeSkillGap: async (roleTitle?: string): Promise<any> => {
    const params = roleTitle ? { role_title: roleTitle } : {};
    const res = await apiClient.get('/skill-intelligence/gap-analysis', { params });
    return res.data;
  },

  getRoadmap: async (roleTitle?: string): Promise<any> => {
    const params = roleTitle ? { role_title: roleTitle } : {};
    const res = await apiClient.get('/skill-intelligence/roadmap', { params });
    return res.data;
  },

  getDashboardSummary: async (): Promise<any> => {
    const res = await apiClient.get('/skill-intelligence/dashboard-summary');
    return res.data;
  },
};
