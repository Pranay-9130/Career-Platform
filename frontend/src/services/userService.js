import api from './api';

export const userService = {
  /**
   * Retrieves the current authenticated student's profile & completion metrics.
   */
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Updates the current authenticated student's profile information.
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },

  /**
   * Retrieves a public portfolio profile by username.
   */
  getPublicProfile: async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },
};

export default userService;
