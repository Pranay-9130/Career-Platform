import api from './api';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/users/dashboard-summary');
    return response.data;
  },
};

export default dashboardService;
