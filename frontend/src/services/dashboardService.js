import api from './api';

export const dashboardService = {
  getSummary: async (options = {}) => {
    const response = await api.get('/users/dashboard-summary', options);
    return response.data;
  },
};

export default dashboardService;
