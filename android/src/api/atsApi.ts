import apiClient from './client';

export const atsApi = {
  analyzeResume: async (payload: {
    resume_text?: string;
    resume_id?: string;
    job_description: string;
  }): Promise<any> => {
    const res = await apiClient.post('/resumes/analyze-ats', payload);
    return res.data;
  },

  getHistory: async (): Promise<any[]> => {
    const res = await apiClient.get('/resumes/ats-history');
    return res.data;
  },
};

export const resumeApi = {
  getResumes: async (): Promise<any[]> => {
    const res = await apiClient.get('/resumes');
    return res.data;
  },

  createResume: async (payload: any): Promise<any> => {
    const res = await apiClient.post('/resumes', payload);
    return res.data;
  },

  updateResume: async (id: string, payload: any): Promise<any> => {
    const res = await apiClient.put(`/resumes/${id}`, payload);
    return res.data;
  },

  deleteResume: async (id: string): Promise<void> => {
    await apiClient.delete(`/resumes/${id}`);
  },
};

