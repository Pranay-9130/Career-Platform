import api from './api.js';

export const careerDiscoveryService = {
  // Fetch discovery status, saved progress, and recommendations
  getStatus: async () => {
    const res = await api.get('/career-discovery');
    return res.data;
  },

  // Save questionnaire progress (Steps 1-5)
  saveProgress: async (payload) => {
    const res = await api.post('/career-discovery/save-progress', payload);
    return res.data;
  },

  // Save a single question's answer incrementally
  saveAnswer: async (questionId, answerOption) => {
    const res = await api.post('/career-discovery/save-answer', {
      question_id: questionId,
      answer_option: answerOption,
    });
    return res.data;
  },

  // Generate 5 questions based on current interests and skill level
  generateAssessment: async () => {
    const res = await api.post('/career-discovery/generate-assessment');
    return res.data;
  },

  // Submit assessment answers and compute recommendations + roadmap
  submitAssessment: async (answers) => {
    const res = await api.post('/career-discovery/submit-assessment', { answers });
    return res.data;
  },

  // Generate or retry roadmap generation from saved assessment
  generateRoadmap: async () => {
    const res = await api.post('/career-discovery/generate-roadmap');
    return res.data;
  },

  // Update a roadmap item's status ('pending', 'in_progress', 'completed')
  updateRoadmapStage: async (stageId, status) => {
    const res = await api.post('/career-discovery/update-roadmap', { stage_id: stageId, status });
    return res.data;
  },

  // Reset discovery to retake
  resetDiscovery: async () => {
    const res = await api.post('/career-discovery/reset');
    return res.data;
  },

  // Lightweight status for Dashboard widget
  getSummary: async () => {
    const res = await api.get('/career-discovery/summary');
    return res.data;
  },
};
