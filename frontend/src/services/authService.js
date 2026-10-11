import api from './api';

const TOKEN_KEY = 'career_platform_token';
const USER_KEY = 'career_platform_user';

export const authService = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (err) {
      console.error('Failed to set token in storage:', err);
    }
  },

  getUser: () => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.error('Failed to set user in storage:', err);
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error('Failed to clear auth storage:', err);
    }
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { access_token, user } = response.data;
    if (access_token) {
      authService.setToken(access_token);
    }
    if (user) {
      authService.setUser(user);
    }
    return response.data;
  },

  loginWithGoogle: async (credential) => {
    const response = await api.post('/auth/google', { credential });
    const { access_token, user } = response.data;
    if (access_token) {
      authService.setToken(access_token);
    }
    if (user) {
      authService.setUser(user);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { access_token, user } = response.data;
    if (access_token) {
      authService.setToken(access_token);
    }
    if (user) {
      authService.setUser(user);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    if (response.data) {
      authService.setUser(response.data);
    }
    return response.data;
  },

  verifyOtp: async ({ email, otp, purpose = 'registration' }) => {
    const response = await api.post('/auth/verify-otp', { email, otp, purpose });
    const { access_token, user } = response.data;
    if (access_token) {
      authService.setToken(access_token);
    }
    if (user) {
      authService.setUser(user);
    }
    return response.data;
  },

  resendOtp: async ({ email, purpose = 'registration' }) => {
    const response = await api.post('/auth/resend-otp', { email, purpose });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async ({ email, token }) => {
    const response = await api.post('/auth/verify-reset-token', { email, token });
    return response.data;
  },

  resetPassword: async ({ email, token, new_password }) => {
    const response = await api.post('/auth/reset-password', {
      email,
      token,
      new_password,
    });
    return response.data;
  },
};

export default authService;
